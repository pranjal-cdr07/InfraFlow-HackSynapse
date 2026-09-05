const bcrypt = require("bcryptjs");
const pool = require("./db");

const users = [
  {
    name: "Project Owner",
    email: "owner@infraflow.com",
    password: "owner123",
    role: "OWNER",
  },
  {
    name: "General Contractor",
    email: "contractor@infraflow.com",
    password: "contractor123",
    role: "GENERAL_CONTRACTOR",
  },
  {
    name: "Subcontractor",
    email: "subcontractor@infraflow.com",
    password: "sub123",
    role: "SUBCONTRACTOR",
  },
  {
    name: "Site Inspector",
    email: "inspector@infraflow.com",
    password: "inspector123",
    role: "INSPECTOR",
  },
  {
    name: "Labourer",
    email: "labourer@infraflow.com",
    password: "labour123",
    role: "LABOURER",
  },
];

async function seedUsers() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashedPassword, user.role],
      );
    }

    console.log("Test users created successfully");
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedUsers();
