// // // models/quizModel.js
// // import mongoose from 'mongoose';

// // const questionSchema = new mongoose.Schema({
// //   question: String,
// //   options: [String],
// //   correctAnswer: String,
// // });

// // const quizSchema = new mongoose.Schema({
// //   title: String,
// //   category: String,
// //   groupId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Group',
// //     required: true,
// //   },
// //   questions: [questionSchema],
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //   },
// // });

// // const Quiz = mongoose.model('Quiz', quizSchema);
// // export default Quiz;


// import mongoose from 'mongoose';

// const questionSchema = new mongoose.Schema({
//   question: String,
//   options: [String],
//   correctAnswer: String,
// });

// // ✅ New schema for storing a student's answers
// const submissionSchema = new mongoose.Schema({
//   student: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   answers: [{
//     question: String,
//     selectedAnswer: String,
//     correctAnswer: String,
//     isCorrect: Boolean,
//   }],
//   score: {
//     type: Number,
//     required: true,
//   },
//   total: {
//     type: Number,
//     required: true,
//   },
//   submittedAt: {
//     type: Date,
//     default: Date.now,
//   }
// });

// const quizSchema = new mongoose.Schema({
//   title: String,
//   category: String,
//   groupId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Group',
//     required: true,
//   },
//   questions: [questionSchema],

//   // ✅ Embed submissions here
//   submissions: [submissionSchema],

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const Quiz = mongoose.model('Quiz', quizSchema);
// export default Quiz;


import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
});

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [{
    question: String,
    selectedAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
  }],
  score: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  }
});

const quizSchema = new mongoose.Schema({
  title: String,
  category: String,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  createdBy: {  // Added this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  submissions: [submissionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // Added timestamps for consistency

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;