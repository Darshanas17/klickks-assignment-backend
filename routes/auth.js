const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// Register
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (row)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword],
      function (err) {
        if (err)
          return res.status(500).json({ message: "Error registering user" });

        req.session.userId = this.lastID; // auto-login
        res.json({
          message: "User registered successfully",
          userId: this.lastID,
        });
      }
    );
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ message: "Login successful" });
  });
});

// Dashboard (protected)
router.get("/dashboard", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Not authenticated" });

  res.json({
    message: "Welcome to the Dashboard!",
    userId: req.session.userId,
  });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
