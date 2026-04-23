import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "⭐",
    },
    colorHex: {
      type: String,
      default: "#6366F1",
    },
    startDate: {
      type: String,
      default: null, // "YYYY-MM-DD" — the day user started this habit
    },
    trackingPeriod: {
      type: Number, // plain Number — accepts any value (7-365)
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Habit = mongoose.model("Habit", habitSchema);

export default Habit;
