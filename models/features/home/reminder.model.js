// models/features/home/reminder.model.js
import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  message: { type: String, required: true },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reminderTime: { type: Date, required: true },
  isNotified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Reminder", reminderSchema);