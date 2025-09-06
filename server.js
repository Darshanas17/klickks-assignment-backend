const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Simplified CORS configuration for production
const allowedOrigins = [
  "https://klickks-assignment-frontend.onrender.com",
  "http://localhost:3000",
  "https://klickks-assignment-frontend-iota.vercel.app",
];

// Use the cors middleware with your specific origin and credentials
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Session setup with SQLite store
app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.db",
      dir: path.join(__dirname),
      table: "sessions",
      concurrentDB: true,
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // For production on Render, we need these two settings
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", authRoutes);

// Health check
app.get("/health", (req, res) => {
  db.get("SELECT 1 as test", (err) => {
    if (err) {
      return res.status(500).json({
        status: "ERROR",
        database: "disconnected",
        error: err.message,
      });
    }
    res.json({
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Klickks Backend API",
    version: "1.0.0",
    database: "SQLite3",
    session_store: "connect-sqlite3",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
