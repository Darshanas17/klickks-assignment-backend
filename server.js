const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://klickks-assignment-frontend-iota.vercel.app/", // frontend URL
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    store: new SQLiteStore(),
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true if using https
      sameSite: "lax",
    },
  })
);

// Routes
app.use("/api", authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
