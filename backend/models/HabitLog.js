import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "habitId is required"],
    },
    date: {
      type: String, // stored as "YYYY-MM-DD"
      required: [true, "date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    status: {
      type: String,
      enum: {
        values: ["done", "missed"],
        message: 'Status must be either "done" or "missed"',
      },
      required: [true, "status is required"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index — only one log entry per habit per day
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

const HabitLog = mongoose.model("HabitLog", habitLogSchema);

export default HabitLog;
