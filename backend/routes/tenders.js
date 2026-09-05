const express = require("express");
const pool = require("../db");
const {
  lockSecurityDeposit,
  retainWinningSecurityDeposit,
  refundSecurityDeposit,
} = require("../services/blockchain");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    cb(null, `tender-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];

    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowed.includes(extension)) {
      return cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    }

    cb(null, true);
  },
});

// GET ALL TENDERS

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        tenders.*,
        COUNT(bids.id)::int AS applicants
      FROM tenders
      LEFT JOIN bids
        ON bids.tender_id = tenders.id
      GROUP BY tenders.id
      ORDER BY tenders.created_at DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET TENDERS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch tenders",
      error: error.message,
    });
  }
});

// CREATE TENDER
// =========================================================
// CREATE TENDER
// =========================================================

router.post("/", upload.single("document"), async (req, res) => {
  const {
    ownerId,
    title,
    description,
    tenderAmount,
    securityDeposit,
    deadline,
  } = req.body;

  try {
    if (!ownerId || !title || !tenderAmount || !securityDeposit) {
      return res.status(400).json({
        message: "Required tender information is missing",
      });
    }

    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO tenders
        (
          owner_id,
          title,
          description,
          tender_amount,
          security_deposit,
          deadline,
          document_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
      [
        ownerId,
        title,
        description || "",
        tenderAmount,
        securityDeposit,
        deadline || null,
        documentPath,
      ],
    );

    res.status(201).json({
      message: "Tender created successfully",

      tender: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE TENDER ERROR:", error.message);

    res.status(500).json({
      message: "Failed to create tender",
      error: error.message,
    });
  }
});

// GET BIDS FOR A TENDER
router.get("/:id/bids", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        bids.id,
        bids.tender_id,
        bids.contractor_id,
        bids.bid_amount,
        bids.security_deposit,
        bids.documents,
        bids.status,
        bids.created_at,
        users.name AS contractor_name,
        users.email AS contractor_email
      FROM bids
      JOIN users
        ON users.id = bids.contractor_id
      WHERE bids.tender_id = $1
      ORDER BY bids.bid_amount ASC`,
      [req.params.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET BIDS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch bids",
      error: error.message,
    });
  }
});

// GET ALL PROJECTS
router.get("/projects/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        projects.*,
        tenders.title AS tender_title,
        owner.name AS owner_name,
        contractor.name AS contractor_name
      FROM projects
      JOIN tenders
        ON tenders.id = projects.tender_id
      LEFT JOIN users owner
        ON owner.id = projects.owner_id
      LEFT JOIN users contractor
        ON contractor.id = projects.contractor_id
      ORDER BY projects.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET PROJECTS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
});

// =========================================================
// GET CAPITAL COMMITTED
// OPEN + AWARDED TENDERS
// =========================================================

router.get("/capital-committed/:ownerId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(tender_amount), 0) AS capital_committed
       FROM tenders
       WHERE owner_id = $1
       AND status IN ('OPEN', 'AWARDED')`,
      [req.params.ownerId],
    );

    res.json({
      capitalCommitted: result.rows[0].capital_committed,
    });
  } catch (error) {
    console.error("CAPITAL COMMITTED ERROR:", error.message);

    res.status(500).json({
      message: "Failed to calculate capital committed",
    });
  }
});

// GET SINGLE TENDER
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tenders WHERE id = $1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Tender not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET TENDER ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch tender",
    });
  }
});

// =========================================================
// SUBMIT BID
// =========================================================

router.post("/:id/bids", upload.array("documents", 10), async (req, res) => {
  const tenderId = req.params.id;

  const { contractorId, bidAmount, securityDeposit } = req.body;

  try {
    const documentPaths = (req.files || []).map(
      (file) => `/uploads/${file.filename}`,
    );

    const documents = JSON.stringify(documentPaths);

    // -----------------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------------

    if (!contractorId || !bidAmount || !securityDeposit) {
      return res.status(400).json({
        message: "Required bid information is missing",
      });
    }

    // -----------------------------------------------------
    // CHECK CONTRACTOR
    // -----------------------------------------------------

    const contractorResult = await pool.query(
      `SELECT id, name, email, role
         FROM users
         WHERE id = $1`,
      [contractorId],
    );

    if (contractorResult.rows.length === 0) {
      return res.status(404).json({
        message: "Contractor not found",
      });
    }

    const contractor = contractorResult.rows[0];

    // -----------------------------------------------------
    // GET TENDER
    // -----------------------------------------------------

    const tenderResult = await pool.query(
      `SELECT *
         FROM tenders
         WHERE id = $1`,
      [tenderId],
    );

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Tender not found",
      });
    }

    const tender = tenderResult.rows[0];

    // -----------------------------------------------------
    // TENDER MUST BE OPEN
    // -----------------------------------------------------

    if (tender.status !== "OPEN") {
      return res.status(400).json({
        message: "This tender is no longer accepting bids",
      });
    }

    // -----------------------------------------------------
    // OWNER CANNOT BID ON OWN TENDER
    // -----------------------------------------------------

    if (Number(tender.owner_id) === Number(contractorId)) {
      return res.status(403).json({
        message: "Tender owner cannot submit a bid",
      });
    }

    // -----------------------------------------------------
    // CHECK DEADLINE
    // -----------------------------------------------------

    if (tender.deadline && new Date(tender.deadline) < new Date()) {
      return res.status(400).json({
        message: "Tender bidding deadline has passed",
      });
    }

    // -----------------------------------------------------
    // SECURITY DEPOSIT MUST MATCH
    // -----------------------------------------------------

    const requiredDeposit = Number(tender.security_deposit);

    const submittedDeposit = Number(securityDeposit);

    if (submittedDeposit !== requiredDeposit) {
      return res.status(400).json({
        message: `Security deposit must be ₹${requiredDeposit.toLocaleString("en-IN")}`,
      });
    }

    // -----------------------------------------------------
    // BID AMOUNT MUST BE VALID
    // -----------------------------------------------------

    const bidValue = Number(bidAmount);

    if (!Number.isFinite(bidValue) || bidValue <= 0) {
      return res.status(400).json({
        message: "Bid amount must be greater than zero",
      });
    }

    // -----------------------------------------------------
    // PREVENT DUPLICATE BID
    // -----------------------------------------------------

    const existingBid = await pool.query(
      `SELECT id
         FROM bids
         WHERE tender_id = $1
         AND contractor_id = $2
         AND status IN ('PENDING', 'ACCEPTED')`,
      [tenderId, contractorId],
    );

    if (existingBid.rows.length > 0) {
      return res.status(400).json({
        message: "You have already submitted a bid for this tender",
      });
    }

    // -----------------------------------------------------
    // CREATE BID
    // -----------------------------------------------------

    const result = await pool.query(
      `INSERT INTO bids
        (
          tender_id,
          contractor_id,
          bid_amount,
          security_deposit,
          documents,
          status
        )
        VALUES
        ($1, $2, $3, $4, $5, 'PENDING')
        RETURNING *`,
      [tenderId, contractorId, bidValue, submittedDeposit, documents || ""],
    );

    const bid = result.rows[0];

    // -----------------------------------------------------
    // LOCK SECURITY DEPOSIT
    // -----------------------------------------------------

    const transaction = await lockSecurityDeposit({
      pool,
      bid,
      contractorId,
    });

    // -----------------------------------------------------
    // NOTIFY OWNER
    // -----------------------------------------------------

    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        tender.owner_id,
        `New bid of ₹${bidValue.toLocaleString("en-IN")} received for "${tender.title}".`,
        "NEW_BID",
      ],
    );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    res.status(201).json({
      message: "Bid submitted successfully",

      bid,

      transaction,
    });
  } catch (error) {
    console.error("SUBMIT BID ERROR:", error.message);

    res.status(500).json({
      message: "Failed to submit bid",

      error: error.message,
    });
  }
});

// SELECT WINNER
router.post("/:id/winner", async (req, res) => {
  console.log("WINNER ROUTE HIT");
  console.log("Tender ID:", req.params.id);
  console.log("Request body:", req.body);

  const tenderId = req.params.id;
  const { bidId } = req.body;

  try {
    if (!bidId) {
      return res.status(400).json({
        message: "Bid ID is required",
      });
    }

    // GET TENDER
    const tenderResult = await pool.query(
      "SELECT * FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Tender not found",
      });
    }

    const tender = tenderResult.rows[0];

    // GET WINNING BID
    const bidResult = await pool.query(
      `SELECT *
       FROM bids
       WHERE id = $1
       AND tender_id = $2`,
      [bidId, tenderId],
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({
        message: "Bid not found for this tender",
      });
    }

    const winningBid = bidResult.rows[0];

    // PREVENT DUPLICATE PROJECT
    const existingProject = await pool.query(
      `SELECT id
       FROM projects
       WHERE tender_id = $1`,
      [tenderId],
    );

    if (existingProject.rows.length > 0) {
      return res.status(400).json({
        message: "A project has already been created for this tender",
      });
    }

    // RETAIN WINNING SECURITY DEPOSIT
    const winningTransaction = await retainWinningSecurityDeposit({
      pool,
      bid: winningBid,
    });

    // UPDATE TENDER
    await pool.query(
      `UPDATE tenders
       SET winner_id = $1,
           status = 'AWARDED'
       WHERE id = $2`,
      [winningBid.contractor_id, tenderId],
    );

    // ACCEPT WINNING BID
    await pool.query(
      `UPDATE bids
       SET status = 'ACCEPTED'
       WHERE id = $1`,
      [bidId],
    );

    // CREATE PROJECT
    const projectResult = await pool.query(
      `INSERT INTO projects
       (
         tender_id,
         owner_id,
         contractor_id,
         name,
         total_amount,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tenderId,
        tender.owner_id,
        winningBid.contractor_id,
        tender.title,
        winningBid.bid_amount,
        "ACTIVE",
      ],
    );

    const project = projectResult.rows[0];

    console.log("PROJECT CREATED:", project);

    // GET LOSING BIDS
    const losingBids = await pool.query(
      `SELECT *
       FROM bids
       WHERE tender_id = $1
       AND id != $2
       AND status = 'PENDING'`,
      [tenderId, bidId],
    );

    console.log("LOSING BIDS:", losingBids.rows);

    // REJECT LOSING BIDS
    await pool.query(
      `UPDATE bids
       SET status = 'REJECTED'
       WHERE tender_id = $1
       AND id != $2`,
      [tenderId, bidId],
    );

    // REFUND LOSING SECURITY DEPOSITS
    for (const bid of losingBids.rows) {
      await refundSecurityDeposit({
        pool,
        bid,
        ownerId: tender.owner_id,
      });
    }

    console.log("WINNER SELECTED SUCCESSFULLY");

    // SEND ONE RESPONSE ONLY
    res.json({
      message: "Winner selected successfully",
      winner: winningBid.contractor_id,
      winningBid: bidId,
      winningDepositTransaction: winningTransaction,
      project,
    });
  } catch (error) {
    console.error("SELECT WINNER ERROR:", error.message);

    res.status(500).json({
      message: "Failed to select winner",
      error: error.message,
    });
  }
});

module.exports = router;
