const express = require("express");
const pool = require("../db");
const { refundSecurityDeposit } = require("../services/blockchain");
const router = express.Router();

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
router.post("/", async (req, res) => {
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

    const result = await pool.query(
      `INSERT INTO tenders
      (
        owner_id,
        title,
        description,
        tender_amount,
        security_deposit,
        deadline
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        ownerId,
        title,
        description || "",
        tenderAmount,
        securityDeposit,
        deadline || null,
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

// SUBMIT BID
router.post("/:id/bids", async (req, res) => {
  const tenderId = req.params.id;

  const { contractorId, bidAmount, securityDeposit, documents } = req.body;

  try {
    if (!contractorId || !bidAmount || !securityDeposit) {
      return res.status(400).json({
        message: "Required bid information is missing",
      });
    }

    // Check tender exists
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

    // Check deadline
    if (tender.deadline && new Date(tender.deadline) < new Date()) {
      return res.status(400).json({
        message: "Tender bidding deadline has passed",
      });
    }

    // Create bid
    const result = await pool.query(
      `INSERT INTO bids
      (
        tender_id,
        contractor_id,
        bid_amount,
        security_deposit,
        documents
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tenderId, contractorId, bidAmount, securityDeposit, documents || ""],
    );

    res.status(201).json({
      message: "Bid submitted successfully",
      bid: result.rows[0],
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
    const bidResult = await pool.query(
      `SELECT * FROM bids
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

    // Update tender
    await pool.query(
      `UPDATE tenders
       SET winner_id = $1,
           status = 'AWARDED'
       WHERE id = $2`,
      [winningBid.contractor_id, tenderId],
    );

    // Accept selected bid
    await pool.query(
      `UPDATE bids
       SET status = 'ACCEPTED'
       WHERE id = $1`,
      [bidId],
    );

    // Create project from awarded tender
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

    // Reject all other bids

    // Get all losing bids
    const losingBids = await pool.query(
      `SELECT *
   FROM bids
   WHERE tender_id = $1
   AND id != $2
   AND status = 'PENDING'`,
      [tenderId, bidId],
    );
    console.log("LOSING BIDS:", losingBids.rows);

    // Reject losing bids
    await pool.query(
      `UPDATE bids
   SET status = 'REJECTED'
   WHERE tender_id = $1
   AND id != $2`,
      [tenderId, bidId],
    );

    // Refund every losing security deposit
    for (const bid of losingBids.rows) {
      await refundSecurityDeposit({
        pool,
        bid,
        ownerId: tender.owner_id,
      });
    }

    console.log("WINNER SELECTED SUCCESSFULLY");

    res.json({
      message: "Winner selected successfully",
      winner: winningBid.contractor_id,
      winningBid: bidId,
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
