const express = require("express");
const pool = require("../db");
const { releaseMilestonePayment } = require("../services/blockchain");

const router = express.Router();


// =========================================================
// GET ALL MILESTONES
// =========================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        milestones.*,
        users.name AS subcontractor_name,
        users.email AS subcontractor_email,
        projects.name AS project_name,
        projects.contractor_id,
        projects.owner_id
      FROM milestones
      LEFT JOIN users
        ON users.id = milestones.subcontractor_id
      LEFT JOIN projects
        ON projects.id = milestones.project_id
      ORDER BY milestones.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(
      "GET MILESTONES ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch milestones",
    });
  }
});


// =========================================================
// GET PROJECTS FOR GENERAL CONTRACTOR
// =========================================================

router.get("/projects/:contractorId", async (req, res) => {
  console.log(
    "GET CONTRACTOR PROJECTS:",
    req.params.contractorId
  );

  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        total_amount,
        status
       FROM projects
       WHERE contractor_id = $1
       ORDER BY created_at DESC`,
      [req.params.contractorId]
    );

    console.log(
      "PROJECTS FOUND:",
      result.rows
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "GET CONTRACTOR PROJECTS ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
});


// =========================================================
// GET INSPECTIONS FOR INSPECTOR
// =========================================================

router.get(
  "/inspections/:inspectorId",
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          inspections.*,
          milestones.title AS milestone_title,
          milestones.description AS milestone_description,
          milestones.amount,
          milestones.proof,
          projects.name AS project_name
         FROM inspections
         JOIN milestones
           ON milestones.id = inspections.milestone_id
         JOIN projects
           ON projects.id = milestones.project_id
         WHERE inspections.inspector_id = $1
         ORDER BY inspections.created_at DESC`,
        [req.params.inspectorId]
      );

      res.json(result.rows);

    } catch (error) {
      console.error(
        "GET INSPECTIONS ERROR:",
        error.message
      );

      res.status(500).json({
        message: "Failed to fetch inspections",
      });
    }
  }
);


// =========================================================
// CREATE MILESTONE
// GENERAL CONTRACTOR
// =========================================================

router.post("/", async (req, res) => {
  const {
    projectId,
    subcontractorId,
    title,
    description,
    amount,
  } = req.body;

  try {

    if (
      !projectId ||
      !subcontractorId ||
      !title ||
      !amount
    ) {
      return res.status(400).json({
        message:
          "Required milestone information is missing",
      });
    }


    // Check project exists
    const projectResult = await pool.query(
      `SELECT *
       FROM projects
       WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }


    // Check subcontractor exists
    const subcontractorResult = await pool.query(
      `SELECT id, name, role
       FROM users
       WHERE id = $1`,
      [subcontractorId]
    );

    if (
      subcontractorResult.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Subcontractor not found",
      });
    }


    if (
      subcontractorResult.rows[0].role !==
      "SUBCONTRACTOR"
    ) {
      return res.status(400).json({
        message:
          "Selected user is not a subcontractor",
      });
    }


    // Create milestone
    const result = await pool.query(
      `INSERT INTO milestones
      (
        project_id,
        subcontractor_id,
        title,
        description,
        amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        projectId,
        subcontractorId,
        title,
        description || "",
        amount,
      ]
    );


    const milestone = result.rows[0];


    // Notify subcontractor
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        subcontractorId,
        `New milestone "${title}" has been assigned to you.`,
        "MILESTONE_CREATED",
      ]
    );


    res.status(201).json({
      message: "Milestone created successfully",
      milestone,
    });

  } catch (error) {
    console.error(
      "CREATE MILESTONE ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create milestone",
      error: error.message,
    });
  }
});


// =========================================================
// SUBCONTRACTOR SUBMITS COMPLETION PROOF
// =========================================================

router.post("/:id/submit", async (req, res) => {
  const milestoneId = req.params.id;
  const { proof } = req.body;

  try {

    if (!proof) {
      return res.status(400).json({
        message: "Proof is required",
      });
    }


    // Find milestone
    const milestoneResult = await pool.query(
      `SELECT
        milestones.*,
        projects.owner_id,
        projects.contractor_id,
        projects.name AS project_name
       FROM milestones
       JOIN projects
         ON projects.id = milestones.project_id
       WHERE milestones.id = $1`,
      [milestoneId]
    );


    if (
      milestoneResult.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Milestone not found",
      });
    }


    const milestone =
      milestoneResult.rows[0];


    // Prevent duplicate submission
    if (milestone.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Milestone has already been submitted",
      });
    }


    // Find available inspector
    const inspectorResult =
      await pool.query(
        `SELECT id, name
         FROM users
         WHERE role = 'INSPECTOR'
         ORDER BY id
         LIMIT 1`
      );


    if (
      inspectorResult.rows.length === 0
    ) {
      return res.status(400).json({
        message: "No inspector is available",
      });
    }


    const inspector =
      inspectorResult.rows[0];


    // Update milestone
    await pool.query(
      `UPDATE milestones
       SET proof = $1,
           status = 'INSPECTION_PENDING'
       WHERE id = $2`,
      [
        proof,
        milestoneId,
      ]
    );


    // Create inspection
    const inspectionResult =
      await pool.query(
        `INSERT INTO inspections
        (
          milestone_id,
          inspector_id,
          status,
          deadline
        )
        VALUES
        (
          $1,
          $2,
          'PENDING',
          NOW() + INTERVAL '2 days'
        )
        RETURNING *`,
        [
          milestoneId,
          inspector.id,
        ]
      );


    // Notify inspector
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        inspector.id,
        `New milestone inspection assigned: ${milestone.title}. Inspection deadline is 2 days.`,
        "INSPECTION_ASSIGNED",
      ]
    );


    // Notify GC
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        milestone.contractor_id,
        `Milestone "${milestone.title}" has been submitted for inspection.`,
        "INSPECTION_PENDING",
      ]
    );


    // Notify owner
    if (milestone.owner_id) {
      await pool.query(
        `INSERT INTO notifications
        (
          user_id,
          message,
          type
        )
        VALUES ($1, $2, $3)`,
        [
          milestone.owner_id,
          `Milestone "${milestone.title}" has been submitted for inspection.`,
          "INSPECTION_PENDING",
        ]
      );
    }


    console.log(
      `INSPECTOR ${inspector.id} ASSIGNED TO MILESTONE ${milestoneId}`
    );


    res.json({
      message:
        "Milestone submitted for inspection",

      milestoneId,

      inspector: {
        id: inspector.id,
        name: inspector.name,
      },

      inspection:
        inspectionResult.rows[0],
    });

  } catch (error) {
    console.error(
      "SUBMIT MILESTONE ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to submit milestone",
      error: error.message,
    });
  }
});


// =========================================================
// INSPECTOR APPROVES MILESTONE
// =========================================================

router.post("/:id/inspect", async (req, res) => {
  const milestoneId = req.params.id;

  const {
    inspectorId,
    report,
    evidence,
  } = req.body;


  try {

    if (!inspectorId) {
      return res.status(400).json({
        message:
          "Inspector ID is required",
      });
    }


    // Find inspection
    const inspectionResult =
      await pool.query(
        `SELECT
          inspections.*,
          milestones.title,
          milestones.subcontractor_id,
          projects.contractor_id,
          projects.owner_id
         FROM inspections
         JOIN milestones
           ON milestones.id =
              inspections.milestone_id
         JOIN projects
           ON projects.id =
              milestones.project_id
         WHERE inspections.milestone_id = $1
         ORDER BY inspections.created_at DESC
         LIMIT 1`,
        [milestoneId]
      );


    if (
      inspectionResult.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Inspection not found",
      });
    }


    const inspection =
      inspectionResult.rows[0];


    // Check assigned inspector
    if (
      Number(inspection.inspector_id) !==
      Number(inspectorId)
    ) {
      return res.status(403).json({
        message:
          "You are not assigned to this inspection",
      });
    }


    // Prevent duplicate inspection
    if (
      inspection.status !== "PENDING"
    ) {
      return res.status(400).json({
        message:
          "Inspection has already been completed",
      });
    }


    // Approve inspection
    await pool.query(
      `UPDATE inspections
       SET status = 'APPROVED',
           report = $1,
           evidence = $2
       WHERE id = $3`,
      [
        report || "",
        evidence || "",
        inspection.id,
      ]
    );


    // Update milestone
    await pool.query(
      `UPDATE milestones
       SET status = 'INSPECTED'
       WHERE id = $1`,
      [milestoneId]
    );


    // Notify subcontractor
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        inspection.subcontractor_id,
        `Milestone "${inspection.title}" has been inspected and approved.`,
        "INSPECTION_APPROVED",
      ]
    );


    // Notify GC
    await pool.query(
      `INSERT INTO notifications
      (
        user_id,
        message,
        type
      )
      VALUES ($1, $2, $3)`,
      [
        inspection.contractor_id,
        `Milestone "${inspection.title}" has passed inspection and is ready for verification.`,
        "VERIFICATION_REQUIRED",
      ]
    );


    // Notify owner
    if (inspection.owner_id) {
      await pool.query(
        `INSERT INTO notifications
        (
          user_id,
          message,
          type
        )
        VALUES ($1, $2, $3)`,
        [
          inspection.owner_id,
          `Milestone "${inspection.title}" has passed inspection.`,
          "INSPECTION_APPROVED",
        ]
      );
    }


    res.json({
      message:
        "Milestone inspected successfully",

      milestoneId,

      status: "INSPECTED",
    });

  } catch (error) {
    console.error(
      "INSPECT MILESTONE ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to inspect milestone",
      error: error.message,
    });
  }
});


// =========================================================
// GENERAL CONTRACTOR VERIFIES MILESTONE
// =========================================================

router.post("/:id/verify", async (req, res) => {
  const milestoneId = req.params.id;


  try {

    // Find milestone
    const result = await pool.query(
      `SELECT
        milestones.*,
        projects.contractor_id,
        projects.owner_id,
        projects.name AS project_name
       FROM milestones
       JOIN projects
         ON projects.id =
            milestones.project_id
       WHERE milestones.id = $1`,
      [milestoneId]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Milestone not found",
      });
    }


    const milestone =
      result.rows[0];


    // Prevent duplicate payment
    if (
      milestone.status === "PAID"
    ) {
      return res.status(400).json({
        message:
          "Milestone payment has already been released",
      });
    }


    // Inspector must approve first
    if (
      milestone.status !== "INSPECTED"
    ) {
      return res.status(400).json({
        message:
          "Milestone has not been approved by inspector",
      });
    }


    // Update milestone
    await pool.query(
      `UPDATE milestones
       SET status = 'PAID'
       WHERE id = $1`,
      [milestoneId]
    );


    // Simulated smart contract payment
    const transaction =
      await releaseMilestonePayment({
        pool,
        milestone,
      });


    res.json({
      message:
        "Milestone verified and payment released",

      transaction,
    });

  } catch (error) {
    console.error(
      "VERIFY MILESTONE ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to verify milestone",
      error: error.message,
    });
  }
});


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;