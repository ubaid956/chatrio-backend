import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  route: { type: String }, // e.g., "Lahore → Dubai → Istanbul"
  destinations: [{
    name: { type: String, required: true },       // e.g., "Burj Khalifa"
    date: { type: Date },                         // optional: visit date
    activities: [String]                          // e.g., ["Observation Deck", "Dinner"]
  }],
  times: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  transportation: [{
    mode: { type: String },                      // e.g., "Flight", "Train", "Car"
    company: { type: String },                   // e.g., "Emirates Airlines"
    from: { type: String },
    to: { type: String },
    departureTime: Date,
    arrivalTime: Date
  }],
  accommodations: [{
    name: { type: String },                      // e.g., "Hilton Hotel"
    address: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    bookingRef: { type: String }
  }],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

export default mongoose.model('Itinerary', itinerarySchema);
