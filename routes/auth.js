const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db"); // your existing db file

const router = express.Router();

// Middleware to check auth
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    console.log("User authenticated:", req.session.userId);
    return next();
  }
  console.log("User not authenticated");
  return res.status(401).json({ message: "Not authenticated" });
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    db.run(
      `INSERT INTO users (email, password) VALUES (?, ?)`,
      [email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(400).json({ message: "Email already exists" });
          }
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json({
          message: "User registered successfully",
          userId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database error" });
        }
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        try {
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            return res
              .status(401)
              .json({ message: "Invalid email or password" });
          }

          req.session.userId = user.id;
          console.log("Login successful for user:", user.id);

          res.json({
            message: "Login successful",
            userId: user.id,
            email: user.email,
          });
        } catch (bcryptError) {
          console.error("Bcrypt error:", bcryptError);
          res.status(500).json({ message: "Server error during login" });
        }
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Dashboard (protected)
router.get("/dashboard", isAuthenticated, (req, res) => {
  try {
    res.json({
      userId: req.session.userId,
      message: "Welcome to dashboard",
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", isAuthenticated, (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

// User info endpoint
router.get("/user", isAuthenticated, (req, res) => {
  db.get(
    `SELECT id, email FROM users WHERE id = ?`,
    [req.session.userId],
    (err, user) => {
      if (err) {
        console.error("User info error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    }
  );
});

module.exports = router;
