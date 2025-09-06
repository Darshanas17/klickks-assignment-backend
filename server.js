const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1); // 👈 important for Render/Heroku behind HTTPS

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://klickks-assignment-frontend-iota.vercel.app", // frontend URL
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // set true if using https
      sameSite: "none",
    },
  })
);

// Routes
app.use("/api", authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
