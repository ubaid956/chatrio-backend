import mongoose from 'mongoose';
const noteSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  title: String,
  content: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true }
}, { timestamps: true });
export default mongoose.model('Note', noteSchema);