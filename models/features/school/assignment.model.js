import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    submittedAt: Date,
    grade: String
  }]
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
