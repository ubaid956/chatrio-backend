import mongoose from 'mongoose';

const studyEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  isPersonal: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("StudyEvent", studyEventSchema);
