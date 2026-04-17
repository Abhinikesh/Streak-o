import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

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

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "StreakBoard API is running 🚀" });
});

// ── Routes will be added here in future prompts ────────────
// app.use("/api/auth",   authRoutes);
// app.use("/api/habits", habitRoutes);
// app.use("/api/logs",   logRoutes);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
