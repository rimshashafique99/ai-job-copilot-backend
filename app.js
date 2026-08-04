const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const pool = require("./db");

const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const analyzeRoutes = require("./routes/analyzeRoutes");
const trackerRoutes = require("./routes/trackerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

module.exports = app;