const express = require("express");
const pool = require("../db");

const router = express.Router();

// =========================================================
// GET NOTIFICATIONS FOR USER
// =========================================================

router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.params.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

// =========================================================
// MARK ONE NOTIFICATION AS READ
// =========================================================

router.post("/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("MARK NOTIFICATION ERROR:", error.message);

    res.status(500).json({
      message: "Failed to update notification",
    });
  }
});

// =========================================================
// MARK ALL USER NOTIFICATIONS AS READ
// =========================================================

router.post("/:userId/read-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1`,
      [req.params.userId],
    );

    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to update notifications",
    });
  }
});

// =========================================================
// GET UNREAD NOTIFICATION COUNT
// =========================================================

router.get("/:userId/unread-count", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
         FROM notifications
         WHERE user_id = $1
         AND is_read = FALSE`,
      [req.params.userId],
    );

    res.json({
      count: result.rows[0].count,
    });
  } catch (error) {
    console.error("UNREAD COUNT ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch unread count",
    });
  }
});

module.exports = router;
