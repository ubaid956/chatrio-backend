import mongoose from 'mongoose';

const TravelDocumentSchema = new mongoose.Schema({
  title: String,
  fileUrl: String,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

export default mongoose.model("TravelDocument", TravelDocumentSchema);
