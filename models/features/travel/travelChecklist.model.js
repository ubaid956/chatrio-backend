import mongoose from 'mongoose';
const travelChecklistSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  destination: { type: String, required: true },
  travelDate: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  items: [
    {
      name: { type: String, required: true },
      isPacked: { type: Boolean, default: false }
    }
  ],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

export default mongoose.model('TravelChecklist', travelChecklistSchema);
