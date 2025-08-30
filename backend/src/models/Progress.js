// models/Progress.js
const mongoose = require("mongoose");

const masteryLevelSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["basic", "intermediate", "advanced", "expert"],
    required: true,
  },
  achieved: {
    type: Boolean,
    default: false,
  },
  achievedAt: Date,
});

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    completionStatus: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    lastAccessed: Date,
    quizResults: [
      {
        quiz: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
        },
        score: Number,
        totalQuestions: Number,
        correctAnswers: Number,
        timeTaken: Number, // in seconds
        attemptedAt: Date,
        detailedResults: [
          {
            question: String,
            userAnswer: mongoose.Schema.Types.Mixed,
            correct: Boolean,
            points: Number,
          },
        ],
      },
    ],
    masteryLevel: masteryLevelSchema,
    understandingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
    },
    badges: [
      {
        name: String,
        description: String,
        earnedAt: Date,
        icon: String,
      },
    ],
    errorPatterns: [
      {
        concept: String,
        errorType: String,
        frequency: Number,
        lastOccurred: Date,
      },
    ],
    recommendations: [
      {
        type: { type: String, enum: ["review", "practice", "challenge"] },
        concept: String,
        priority: { type: String, enum: ["low", "medium", "high"] },
        suggestedResources: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

progressSchema.index({ student: 1, course: 1 });
progressSchema.index({ student: 1, updatedAt: -1 });

module.exports = mongoose.model("Progress", progressSchema);
