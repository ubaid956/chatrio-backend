import mongoose from 'mongoose';
const ideaSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true },
    title: String,
}, { timestamps: true });
export default mongoose.model('Idea', ideaSchema);