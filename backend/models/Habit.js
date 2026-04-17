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
      type: String, // emoji string e.g. "🏃"
      default: "⭐",
    },
    colorHex: {
      type: String, // e.g. "#FF6B6B"
      default: "#6366F1",
    },
    trackingPeriod: {
      type: Number,
      enum: [30, 60, 90],
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
