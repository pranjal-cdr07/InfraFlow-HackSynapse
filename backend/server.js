const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/auth");
const tenderRoutes = require("./routes/tenders");

const app = express();

const milestoneRoutes = require("./routes/milestones");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/milestones", milestoneRoutes);

app.get("/", (req, res) => {
  res.send("InfraFlow Backend is running");
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      database: "Connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      status: "ERROR",
      database: "Not connected",
    });
  }
});

app.listen(5000, () => {
  console.log("InfraFlow Backend running on port 5000");
});
