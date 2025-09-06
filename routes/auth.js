const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ message: "Not authenticated" });
}
// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const hashed = await bcrypt.hash(password, 12);

    db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashed],
      function (err) {
        if (err) {
          if (err.message && err.message.includes("UNIQUE"))
            return res.status(400).json({ message: "Email already exists" });
          return res.status(500).json({ message: "Database error" });
        }
        return res
          .status(201)
          .json({ message: "User registered", userId: this.lastID });
      }
    );
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });

    // create session
    req.session.userId = user.id;
    return res.json({ message: "Login successful" });
  });
});

// Protected dashboard
router.get("/dashboard", isAuthenticated, (req, res) => {
  return res.json({
    userId: req.session.userId,
    message: "Welcome to dashboard",
  });
});

// Logout
router.post("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid", { path: "/" });
    return res.json({ message: "Logged out" });
  });
});

module.exports = router;
