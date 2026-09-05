const express = require("express");
const pool = require("../db");

const router = express.Router();

// =========================================================
// GET ALL TRANSACTIONS
// =========================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        transactions.*,

        from_user.name AS from_user_name,
        from_user.email AS from_user_email,

        to_user.name AS to_user_name,
        to_user.email AS to_user_email

       FROM transactions

       LEFT JOIN users AS from_user
         ON from_user.id = transactions.from_user

       LEFT JOIN users AS to_user
         ON to_user.id = transactions.to_user

       ORDER BY transactions.created_at DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
});

// =========================================================
// GET TRANSACTIONS FOR USER
// =========================================================

router.get("/user/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        transactions.*,

        from_user.name AS from_user_name,
        to_user.name AS to_user_name

       FROM transactions

       LEFT JOIN users AS from_user
         ON from_user.id = transactions.from_user

       LEFT JOIN users AS to_user
         ON to_user.id = transactions.to_user

       WHERE transactions.from_user = $1
          OR transactions.to_user = $1

       ORDER BY transactions.created_at DESC`,
      [req.params.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET USER TRANSACTIONS ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch user transactions",
    });
  }
});

// =========================================================
// GET SINGLE TRANSACTION
// =========================================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        transactions.*,

        from_user.name AS from_user_name,
        from_user.email AS from_user_email,

        to_user.name AS to_user_name,
        to_user.email AS to_user_email

       FROM transactions

       LEFT JOIN users AS from_user
         ON from_user.id = transactions.from_user

       LEFT JOIN users AS to_user
         ON to_user.id = transactions.to_user

       WHERE transactions.id = $1`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET TRANSACTION ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch transaction",
    });
  }
});

module.exports = router;
