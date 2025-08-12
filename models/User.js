import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  googleId: String,
  authType: {
    type: String,
    enum: ['google', 'manual'],
    default: 'manual',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: { type: String, unique: true, sparse: true },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Never return password in queries
  },
  currentStatus: {
    type: String,
    enum: ['Home', 'Work', 'School'],
    default: 'Home'
  },
  mood: {
    type: String,
    enum: ['Happy', 'Sad', 'Neutral', 'Excited', 'Angry'],
    default: 'Neutral'
  },
  currentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  pic: {
    type: String,
    required: true,
    default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    maxlength: 50,
    default: ""
  },
  location: {
    type: String,
    maxlength: 100,
    default: "Sharjah, UAE"
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
// userSchema.index({ currentStatus: 1 });
// userSchema.index({ groups: 1 });
userSchema.methods.isOtpExpired = function () {
  return this.otpExpiresAt ? new Date() > this.otpExpiresAt : true;
};
const User = mongoose.model('User', userSchema);
export default User;