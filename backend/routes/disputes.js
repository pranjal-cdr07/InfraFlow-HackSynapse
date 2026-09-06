const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../db");
const crypto = require("crypto");

const router = express.Router();
function generateTxHash() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

/* =========================================================
   FILE UPLOAD SETUP
========================================================= */

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP and PDF files are allowed."));
    }
  },
});

/* =========================================================
   GET MY DISPUTES
   GET /api/disputes/mine/:userId
========================================================= */

router.get("/mine/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
        d.*,
        raised.name AS raised_by_name,
        resolver.name AS resolved_by_name,
        p.name AS project_name,
        m.title AS milestone_title
      FROM disputes d

      LEFT JOIN users raised
        ON raised.id = d.raised_by

      LEFT JOIN users resolver
        ON resolver.id = d.resolved_by

      LEFT JOIN projects p
        ON p.id = d.project_id

      LEFT JOIN milestones m
        ON m.id = d.milestone_id

      WHERE d.raised_by = $1

      ORDER BY d.created_at DESC
      `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get my disputes error:", error);

    res.status(500).json({
      message: "Failed to load disputes",
    });
  }
});

/* =========================================================
   GET OWNER DISPUTE INBOX
   GET /api/disputes/owner
========================================================= */

router.get("/owner", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        d.*,
        raised.name AS raised_by_name,
        raised.email AS raised_by_email,
        resolver.name AS resolved_by_name,
        p.name AS project_name,
        m.title AS milestone_title

      FROM disputes d

      LEFT JOIN users raised
        ON raised.id = d.raised_by

      LEFT JOIN users resolver
        ON resolver.id = d.resolved_by

      LEFT JOIN projects p
        ON p.id = d.project_id

      LEFT JOIN milestones m
        ON m.id = d.milestone_id

      ORDER BY
        CASE
          WHEN d.status = 'OPEN' THEN 1
          WHEN d.status = 'ESCALATED' THEN 2
          WHEN d.status = 'RESOLVED' THEN 3
          WHEN d.status = 'REJECTED' THEN 4
          ELSE 5
        END,

        CASE
          WHEN d.priority = 'HIGH' THEN 1
          WHEN d.priority = 'MEDIUM' THEN 2
          WHEN d.priority = 'LOW' THEN 3
          ELSE 4
        END,

        d.created_at DESC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get owner disputes error:", error);

    res.status(500).json({
      message: "Failed to load owner disputes",
    });
  }
});

/* =========================================================
   GET SINGLE DISPUTE
   GET /api/disputes/:id
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        d.*,
        raised.name AS raised_by_name,
        raised.email AS raised_by_email,
        raised.role AS raised_by_role,
        resolver.name AS resolved_by_name,
        p.name AS project_name,
        m.title AS milestone_title

      FROM disputes d

      LEFT JOIN users raised
        ON raised.id = d.raised_by

      LEFT JOIN users resolver
        ON resolver.id = d.resolved_by

      LEFT JOIN projects p
        ON p.id = d.project_id

      LEFT JOIN milestones m
        ON m.id = d.milestone_id

      WHERE d.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Dispute not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get dispute error:", error);

    res.status(500).json({
      message: "Failed to load dispute",
    });
  }
});

/* =========================================================
   CREATE DISPUTE
   POST /api/disputes
========================================================= */

router.post("/", upload.array("evidence", 5), async (req, res) => {
  try {
    const {
      raisedBy,
      projectId,
      milestoneId,
      issueType,
      title,
      description,
      targetRole,
      priority,
    } = req.body;

    if (!raisedBy || !issueType || !title || !description || !targetRole) {
      return res.status(400).json({
        message: "Please fill all required dispute fields.",
      });
    }

    /* -------------------------------------------------------
       STORE EVIDENCE FILE PATHS
    ------------------------------------------------------- */

    const evidenceFiles = (req.files || []).map((file) => ({
      name: file.originalname,
      path: `/uploads/${file.filename}`,
      type: file.mimetype,
    }));

    const evidence =
      evidenceFiles.length > 0
        ? JSON.stringify(evidenceFiles)
        : JSON.stringify([]);

    /* -------------------------------------------------------
       CREATE DISPUTE
    ------------------------------------------------------- */

    const result = await pool.query(
      `
      INSERT INTO disputes (
        raised_by,
        project_id,
        milestone_id,
        issue_type,
        title,
        description,
        target_role,
        priority,
        evidence
      )

      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )

      RETURNING *
      `,
      [
        raisedBy,
        projectId || null,
        milestoneId || null,
        issueType,
        title,
        description,
        targetRole,
        priority || "MEDIUM",
        evidence,
      ],
    );

    const dispute = result.rows[0];

    /* =====================================================
       NOTIFY TARGET USERS
    ===================================================== */

    const targetUsers = await pool.query(
      `
      SELECT id
      FROM users
      WHERE role = $1
      `,
      [targetRole],
    );

    for (const user of targetUsers.rows) {
      await pool.query(
        `
        INSERT INTO notifications (
          user_id,
          message,
          type
        )

        VALUES (
          $1,
          $2,
          $3
        )
        `,
        [user.id, `New dispute raised: ${title}`, "DISPUTE"],
      );
    }

    res.status(201).json({
      message: "Dispute submitted successfully.",
      dispute,
    });
  } catch (error) {
    console.error("Create dispute error:", error);

    res.status(500).json({
      message: "Failed to create dispute.",
    });
  }
});

/* =========================================================
   FREEZE DISPUTE
   POST /api/disputes/:id/freeze
========================================================= */

router.post("/:id/freeze", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    /* Check user */
    const userResult = await pool.query(
      `
      SELECT id, role
      FROM users
      WHERE id = $1
      `,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (userResult.rows[0].role !== "OWNER") {
      return res.status(403).json({
        message: "Only the Project Owner can freeze disputes.",
      });
    }

    /* Find dispute */
    const disputeResult = await pool.query(
      `
      SELECT *
      FROM disputes
      WHERE id = $1
      `,
      [id],
    );

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Dispute not found.",
      });
    }

    const dispute = disputeResult.rows[0];

    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
      return res.status(400).json({
        message: "Closed disputes cannot be frozen.",
      });
    }

    if (dispute.frozen) {
      return res.status(400).json({
        message: "This dispute is already frozen.",
      });
    }

    /* Dummy blockchain transaction */

    const txHash = generateTxHash();

    await pool.query(
      `
      INSERT INTO transactions (
        type,
        from_user,
        to_user,
        amount,
        status,
        tx_hash
      )
      VALUES (
        $1,
        $2,
        NULL,
        NULL,
        $3,
        $4
      )
      `,
      ["DISPUTE_VAULT_FREEZE", userId, "CONFIRMED", txHash],
    );

    /* Update dispute */

    const result = await pool.query(
      `
      UPDATE disputes
      SET
        frozen = TRUE,
        status = 'ESCALATED'
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    /* Notify person who raised dispute */

    await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)
      `,
      [
        dispute.raised_by,
        `Dispute "${dispute.title}" has been frozen and escalated.`,
        "DISPUTE",
      ],
    );

    res.json({
      message: "Dispute frozen successfully.",
      transaction: {
        type: "DISPUTE_VAULT_FREEZE",
        txHash,
      },
      dispute: result.rows[0],
    });
  } catch (error) {
    console.error("Freeze dispute error:", error);

    res.status(500).json({
      message: error.message || "Failed to freeze dispute.",
    });
  }
});
/* =========================================================
   RESOLVE / REJECT DISPUTE
   POST /api/disputes/:id/resolve
========================================================= */

router.post("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;

    const { userId, resolution, action } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    if (!resolution || !resolution.trim()) {
      return res.status(400).json({
        message: "Resolution is required.",
      });
    }

    if (!["RESOLVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        message: "Invalid dispute action.",
      });
    }

    /* Check user */

    const userResult = await pool.query(
      `
      SELECT id, role
      FROM users
      WHERE id = $1
      `,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (userResult.rows[0].role !== "OWNER") {
      return res.status(403).json({
        message: "Only the Project Owner can resolve disputes.",
      });
    }

    /* Find dispute */

    const disputeResult = await pool.query(
      `
      SELECT *
      FROM disputes
      WHERE id = $1
      `,
      [id],
    );

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Dispute not found.",
      });
    }

    const dispute = disputeResult.rows[0];

    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
      return res.status(400).json({
        message: "This dispute has already been closed.",
      });
    }

    /* Dummy blockchain transaction */

    const txHash = generateTxHash();

    await pool.query(
      `
      INSERT INTO transactions (
        type,
        from_user,
        to_user,
        amount,
        status,
        tx_hash
      )
      VALUES (
        $1,
        $2,
        $3,
        NULL,
        $4,
        $5
      )
      `,
      ["DISPUTE_RESOLUTION", userId, dispute.raised_by, "CONFIRMED", txHash],
    );

    /* Update dispute */

    const newStatus = action === "RESOLVE" ? "RESOLVED" : "REJECTED";

    const result = await pool.query(
      `
      UPDATE disputes
      SET
        status = $1,
        resolution = $2,
        resolved_by = $3,
        frozen = FALSE,
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [newStatus, resolution.trim(), userId, id],
    );

    /* Notify dispute creator */

    const notificationMessage =
      action === "RESOLVE"
        ? `Your dispute "${dispute.title}" has been resolved.`
        : `Your dispute "${dispute.title}" has been rejected.`;

    await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)
      `,
      [dispute.raised_by, notificationMessage, "DISPUTE"],
    );

    res.json({
      message:
        action === "RESOLVE"
          ? "Dispute resolved successfully."
          : "Dispute rejected successfully.",

      transaction: {
        type: "DISPUTE_RESOLUTION",
        txHash,
      },

      dispute: result.rows[0],
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);

    res.status(500).json({
      message: error.message || "Failed to update dispute.",
    });
  }
});
/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
