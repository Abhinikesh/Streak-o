import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabitPrivacy,
} from "../controllers/habitController.js";

const router = express.Router();

// All habit routes are protected
router.use(authMiddleware);

// GET    /api/habits       → list all active habits for user
router.get("/", getHabits);

// POST   /api/habits       → create a new habit
router.post("/", createHabit);

// GET    /api/habits/:id   → get a single habit by id
router.get("/:id", getHabitById);

// PUT    /api/habits/:id   → update a habit
router.put("/:id", updateHabit);

// DELETE /api/habits/:id   → soft-delete a habit
router.delete("/:id", deleteHabit);

// PATCH  /api/habits/:id/privacy → toggle isPublic
router.patch("/:id/privacy", toggleHabitPrivacy);

export default router;
