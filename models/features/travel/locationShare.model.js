// models/features/travel/locationShare.model.js
import mongoose from 'mongoose';

const locationShareSchema = new mongoose.Schema({
   sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  locationName: { type: String }, // Optional: like "Hotel XYZ"
  message: { type: String },      // Optional user note
  sharedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model("Location", locationShareSchema);
