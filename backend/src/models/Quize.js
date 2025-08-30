// models/Quiz.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer", "essay"],
    required: true,
  },
  options: [String],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  explanation: String,
  points: {
    type: Number,
    default: 1,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  timeLimit: Number, // in seconds
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    questions: [questionSchema],
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    showAnswers: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ course: 1, lesson: 1 });

module.exports = mongoose.model("Quiz", quizSchema);
