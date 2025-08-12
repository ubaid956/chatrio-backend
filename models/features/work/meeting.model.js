import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  join_url: {
    type: String,
    required: true
  },
  meeting_id: {
    type: String,
    required: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;

// clientid=940223357277-gt0308vqbfqgr49nf2ejodkgt0r0c1rc.apps.googleusercontent.com
// clientsecret=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