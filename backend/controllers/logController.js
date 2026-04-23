import HabitLog from "../models/HabitLog.js";
import mongoose from "mongoose";

// ── POST /api/logs ─────────────────────────────────────────────
export const logHabit = async (req, res) => {
  try {
    const { habitId, date, status, note } = req.body;

    if (!habitId || !date || !status) {
      return res.status(400).json({ message: "habitId, date, and status are required" });
    }
    if (!["done", "missed"].includes(status)) {
      return res.status(400).json({ message: 'status must be "done" or "missed"' });
    }

    const setFields = { userId: req.user.id, habitId, date, status };
    if (note !== undefined) setFields.note = note.slice(0, 280);

    const log = await HabitLog.findOneAndUpdate(
      { habitId, date },
      { $set: setFields },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(log);
  } catch (err) {
    console.error("[logHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/logs/:habitId ─────────────────────────────────────
export const getLogsForHabit = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { month } = req.query;

    const filter = { habitId, userId: req.user.id };
    if (month) filter.date = { $regex: `^${month}` };

    const logs = await HabitLog.find(filter).sort({ date: 1 });
    return res.status(200).json(logs);
  } catch (err) {
    console.error("[getLogsForHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/logs/all ──────────────────────────────────────────
export const getAllLogsForUser = async (req, res) => {
  try {
    const rawLogs = await HabitLog.find({ userId: req.user.id }).sort({ date: -1 });

    // Flat array — include note field
    const logs = rawLogs.map(log => ({
      _id: log._id,
      habit: log.habitId,
      habitId: log.habitId,
      date: log.date,
      status: log.status,
      note: log.note || '',
    }));

    return res.status(200).json(logs);
  } catch (err) {
    console.error("[getAllLogsForUser]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PATCH /api/logs/:id/note ───────────────────────────────────
export const updateLogNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (note === undefined) {
      return res.status(400).json({ message: "note field is required" });
    }
    if (note.length > 280) {
      return res.status(400).json({ message: "Note cannot exceed 280 characters" });
    }

    const log = await HabitLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { note } },
      { new: true }
    );

    if (!log) return res.status(404).json({ message: "Log not found" });
    return res.status(200).json(log);
  } catch (err) {
    console.error("[updateLogNote]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/logs/:id ───────────────────────────────────────
export const deleteLog = async (req, res) => {
  try {
    const log = await HabitLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!log) return res.status(404).json({ message: "Log not found" });
    return res.status(200).json({ message: "Log deleted" });
  } catch (err) {
    console.error("[deleteLog]", err);
    return res.status(500).json({ message: "Server error" });
  }
};
