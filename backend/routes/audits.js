const express = require("express");
const pool = require("../db");

const router = express.Router();

// INITIATE SURPRISE AUDIT
router.post("/surprise", async (req, res) => {
  const { contractorId } = req.body;

  try {
    if (!contractorId) {
      return res.status(400).json({
        message: "Contractor ID is required",
      });
    }

    // Check contractor
    const contractorResult = await pool.query(
      `SELECT id, name, role
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

    const role = String(contractor.role).trim().toUpperCase();

    if (role !== "GENERAL_CONTRACTOR" && role !== "CONTRACTOR") {
      return res.status(403).json({
        message: "Only general contractors can initiate surprise audits",
      });
    }

    // Find an active project belonging to this contractor
    const projectResult = await pool.query(
      `SELECT
        projects.id,
        projects.name,
        projects.owner_id,
        projects.contractor_id,
        owner.name AS owner_name
       FROM projects
       LEFT JOIN users owner
         ON owner.id = projects.owner_id
       WHERE projects.contractor_id = $1
       AND projects.status = 'ACTIVE'
       ORDER BY projects.created_at DESC
       LIMIT 1`,
      [contractorId],
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "No active project found for this contractor",
      });
    }

    const project = projectResult.rows[0];

    // Find an inspector
    const inspectorResult = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE role = 'INSPECTOR'
       ORDER BY id ASC
       LIMIT 1`,
    );

    if (inspectorResult.rows.length === 0) {
      return res.status(404).json({
        message: "No inspector available",
      });
    }

    const inspector = inspectorResult.rows[0];

    // Create audit
    const auditResult = await pool.query(
      `INSERT INTO surprise_audits
       (
         project_id,
         inspector_id,
         requested_by,
         status,
         reason
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        project.id,
        inspector.id,
        contractorId,
        "PENDING",
        "Surprise quality and compliance audit requested by general contractor",
      ],
    );

    const audit = auditResult.rows[0];

    // Notify inspector
    await pool.query(
      `INSERT INTO notifications
       (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [
        inspector.id,
        `Surprise audit assigned for project "${project.name}".`,
        "SURPRISE_AUDIT",
      ],
    );

    // Notify owner
    await pool.query(
      `INSERT INTO notifications
       (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [
        project.owner_id,
        `A surprise audit has been initiated for project "${project.name}".`,
        "SURPRISE_AUDIT",
      ],
    );

    res.status(201).json({
      message: "Surprise audit initiated successfully",
      audit: {
        ...audit,
        inspector_name: inspector.name,
        inspector_email: inspector.email,
        project_name: project.name,
      },
    });
  } catch (error) {
    console.error("SURPRISE AUDIT ERROR:", error.message);

    res.status(500).json({
      message: "Failed to initiate surprise audit",
      error: error.message,
    });
  }
});

// GET AUDITS FOR INSPECTOR
router.get("/inspector/:inspectorId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        surprise_audits.*,
        projects.name AS project_name
       FROM surprise_audits
       JOIN projects
         ON projects.id = surprise_audits.project_id
       WHERE surprise_audits.inspector_id = $1
       ORDER BY surprise_audits.created_at DESC`,
      [req.params.inspectorId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET SURPRISE AUDITS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch surprise audits",
    });
  }
});

// GET AUDITS FOR PROJECT
router.get("/project/:projectId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        surprise_audits.*,
        projects.name AS project_name,
        inspector.name AS inspector_name
       FROM surprise_audits
       JOIN projects
         ON projects.id = surprise_audits.project_id
       LEFT JOIN users inspector
         ON inspector.id = surprise_audits.inspector_id
       WHERE surprise_audits.project_id = $1
       ORDER BY surprise_audits.created_at DESC`,
      [req.params.projectId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET PROJECT AUDITS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch project audits",
    });
  }
});

// Get surprise audits assigned to an inspector
router.get("/inspector/:inspectorId", async (req, res) => {
  const { inspectorId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
          surprise_audits.*,
          projects.name AS project_name,
          inspector.name AS inspector_name,
          requester.name AS requester_name
       FROM surprise_audits
       LEFT JOIN projects
         ON projects.id = surprise_audits.project_id
       LEFT JOIN users inspector
         ON inspector.id = surprise_audits.inspector_id
       LEFT JOIN users requester
         ON requester.id = surprise_audits.requested_by
       WHERE surprise_audits.inspector_id = $1
       ORDER BY surprise_audits.created_at DESC`,
      [inspectorId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Inspector audit fetch error:", error);

    res.status(500).json({
      message: "Failed to load audits",
    });
  }
});

// Complete a surprise audit
router.post("/:auditId/complete", async (req, res) => {
  const { auditId } = req.params;
  const { report, evidence } = req.body;

  try {
    if (!report) {
      return res.status(400).json({
        message: "Inspection report is required",
      });
    }

    const auditResult = await pool.query(
      `SELECT *
       FROM surprise_audits
       WHERE id = $1`,
      [auditId],
    );

    if (auditResult.rows.length === 0) {
      return res.status(404).json({
        message: "Audit not found",
      });
    }

    const audit = auditResult.rows[0];

    if (audit.status === "COMPLETED") {
      return res.status(400).json({
        message: "This audit has already been completed",
      });
    }

    const result = await pool.query(
      `UPDATE surprise_audits
       SET status = 'COMPLETED',
           reason = $1
       WHERE id = $2
       RETURNING *`,
      [`${report}${evidence ? ` | Evidence: ${evidence}` : ""}`, auditId],
    );

    // Notify contractor
    await pool.query(
      `INSERT INTO notifications
        (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [
        audit.requested_by,
        "Surprise audit has been completed by the inspector.",
        "SURPRISE_AUDIT_COMPLETED",
      ],
    );

    // Notify owner
    const projectResult = await pool.query(
      `SELECT owner_id, name
       FROM projects
       WHERE id = $1`,
      [audit.project_id],
    );

    if (projectResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications
          (user_id, message, type)
         VALUES ($1, $2, $3)`,
        [
          projectResult.rows[0].owner_id,
          `Surprise audit completed for project "${projectResult.rows[0].name}".`,
          "SURPRISE_AUDIT_COMPLETED",
        ],
      );
    }

    res.json({
      message: "Surprise audit completed successfully",
      audit: result.rows[0],
    });
  } catch (error) {
    console.error("Audit completion error:", error);

    res.status(500).json({
      message: "Failed to complete audit",
    });
  }
});

module.exports = router;
