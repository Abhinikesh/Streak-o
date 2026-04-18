import Habit from "../models/Habit.js";

// ── POST /api/habits ───────────────────────────────────────────
/**
 * Create a new habit for the authenticated user.
 * Body: { name, icon, colorHex, trackingPeriod }
 */
export const createHabit = async (req, res) => {
  try {
    const { name, icon, colorHex, trackingPeriod } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      icon,
      colorHex,
      trackingPeriod,
    });

    return res.status(201).json(habit);
  } catch (err) {
    console.error("[createHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/habits ────────────────────────────────────────────
/**
 * Return all active habits for the authenticated user,
 * sorted oldest-first.
 */
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user.id,
      isActive: true,
    }).sort({ createdAt: 1 });

    return res.status(200).json(habits);
  } catch (err) {
    console.error("[getHabits]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/habits/:id ────────────────────────────────────────
/**
 * Return a single habit by id, only if it belongs to req.user.id.
 */
export const getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    return res.status(200).json(habit);
  } catch (err) {
    console.error("[getHabitById]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PUT /api/habits/:id ────────────────────────────────────────
/**
 * Update a habit's editable fields.
 * Body: { name, icon, colorHex, trackingPeriod }
 * Only updates if the habit belongs to req.user.id.
 */
export const updateHabit = async (req, res) => {
  try {
    const { name, icon, colorHex, trackingPeriod } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { name, icon, colorHex, trackingPeriod } },
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    return res.status(200).json(habit);
  } catch (err) {
    console.error("[updateHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/habits/:id ─────────────────────────────────────
/**
 * Soft-delete a habit by setting isActive = false.
 * Only if habit belongs to req.user.id.
 */
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    return res.status(200).json({ message: "Habit removed" });
  } catch (err) {
    console.error("[deleteHabit]", err);
    return res.status(500).json({ message: "Server error" });
  }
};
