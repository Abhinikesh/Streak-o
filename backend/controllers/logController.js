import HabitLog from "../models/HabitLog.js";
import mongoose from "mongoose";

// ── POST /api/logs ─────────────────────────────────────────────
/**
 * Create or update a log entry for a given habit + date.
 * Body: { habitId, date, status }
 * Uses upsert so re-tapping the same day updates instead of duplicating.
 */
export const logHabit = async (req, res) => {
  try {
    const { habitId, date, status } = req.body;

    if (!habitId || !date || !status) {
      return res
        .status(400)
        .json({ message: "habitId, date, and status are required" });
    }

    if (!["done", "missed"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'status must be "done" or "missed"' });
    }

    const log = await HabitLog.findOneAndUpdate(
      { habitId, date },
      { $set: { userId: req.user.id, habitId, date, status } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(log);
  } catch (err) {
    console.error("[logHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/logs/:habitId ─────────────────────────────────────
/**
 * Return all logs for a specific habit belonging to req.user.id.
 * Optional query param: ?month=YYYY-MM  (e.g. ?month=2025-04)
 * When provided, only logs whose date starts with that prefix are returned.
 */
export const getLogsForHabit = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { month } = req.query; // optional: "YYYY-MM"

    const filter = {
      habitId,
      userId: req.user.id,
    };

    if (month) {
      // Match any date starting with the given YYYY-MM prefix
      filter.date = { $regex: `^${month}` };
    }

    const logs = await HabitLog.find(filter).sort({ date: 1 });

    return res.status(200).json(logs);
  } catch (err) {
    console.error("[getLogsForHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/logs/all ──────────────────────────────────────────
/**
 * Return all logs for the authenticated user, grouped by habitId.
 * Format: [ { habitId, logs: [ { date, status } ] } ]
 */
export const getAllLogsForUser = async (req, res) => {
  try {
    const rawLogs = await HabitLog.find({ userId: req.user.id }).sort({
      date: 1,
    });

    // Group in JS to avoid a heavy aggregation pipeline
    const grouped = {};
    for (const log of rawLogs) {
      const key = log.habitId.toString();
      if (!grouped[key]) {
        grouped[key] = { habitId: log.habitId, logs: [] };
      }
      grouped[key].logs.push({ date: log.date, status: log.status });
    }

    return res.status(200).json(Object.values(grouped));
  } catch (err) {
    console.error("[getAllLogsForUser]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/logs/:id ───────────────────────────────────────
/**
 * Delete a specific log entry by its _id.
 * Only allowed if the log belongs to req.user.id.
 */
export const deleteLog = async (req, res) => {
  try {
    const log = await HabitLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    return res.status(200).json({ message: "Log deleted" });
  } catch (err) {
    console.error("[deleteLog]", err);
    return res.status(500).json({ message: "Server error" });
  }
};
