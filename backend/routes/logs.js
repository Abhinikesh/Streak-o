import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  logHabit,
  getLogsForHabit,
  getAllLogsForUser,
  deleteLog,
  updateLogNote,
} from "../controllers/logController.js";

const router = express.Router();

router.use(authMiddleware);

// POST   /api/logs              → create or update a log entry (upsert)
router.post("/", logHabit);

// GET    /api/logs/all          → all logs for user (flat array)
// ⚠️  Must be before /:habitId
router.get("/all", getAllLogsForUser);

// GET    /api/logs/:habitId     → logs for a specific habit (?month=YYYY-MM)
router.get("/:habitId", getLogsForHabit);

// PATCH  /api/logs/:id/note    → update note on a specific log
router.patch("/:id/note", updateLogNote);

// DELETE /api/logs/:id          → delete a specific log entry
router.delete("/:id", deleteLog);

export default router;
