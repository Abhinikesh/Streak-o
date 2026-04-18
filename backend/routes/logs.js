import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  logHabit,
  getLogsForHabit,
  getAllLogsForUser,
  deleteLog,
} from "../controllers/logController.js";

const router = express.Router();

// All log routes are protected
router.use(authMiddleware);

// POST   /api/logs              → create or update a log entry (upsert)
router.post("/", logHabit);

// GET    /api/logs/all          → all logs for user grouped by habitId
// ⚠️  Must be registered BEFORE /:habitId to prevent "all" being caught as an id
router.get("/all", getAllLogsForUser);

// GET    /api/logs/:habitId     → logs for a specific habit (?month=YYYY-MM)
router.get("/:habitId", getLogsForHabit);

// DELETE /api/logs/:id          → delete a specific log entry
router.delete("/:id", deleteLog);

export default router;
