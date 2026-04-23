import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import socialRoutes from "./routes/social.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ── Passport (JWT-only, no sessions needed) ────────────────────
app.use(passport.initialize());

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "StreakBoard API is running 🚀" });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs",   logRoutes);
app.use("/api/social", socialRoutes);

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
