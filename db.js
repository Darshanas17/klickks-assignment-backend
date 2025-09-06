const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.resolve(__dirname, "users.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    initializeUsersTable();
  }
});

function initializeUsersTable() {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating users table:", err.message);
      } else {
        console.log("Users table ready.");
        addSampleAdmin();
      }
    }
  );
}

// Add sample admin user
async function addSampleAdmin() {
  const sampleEmail = "admin@example.com";
  const samplePassword = "Admin@123";

  try {
    const hashedPassword = await bcrypt.hash(samplePassword, 10);
    db.run(
      `INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)`,
      [sampleEmail, hashedPassword],
      (err) => {
        if (err) console.error("Error inserting sample user:", err.message);
        else console.log("Sample admin user added with hashed password.");
      }
    );
  } catch (err) {
    console.error("Error hashing password:", err.message);
  }
}

module.exports = db;
