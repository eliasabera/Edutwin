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
  options: [
    {
      type: String,
    },
  ],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  points: {
    type: Number,
    default: 1,
  },
  explanation: {
    type: String,
  },
  order: {
    type: Number,
    required: true,
  },
});

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["lesson", "quiz", "material"],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      enum: [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "English",
        "History",
      ],
    },

    // Common fields
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Lesson-specific fields
    youtubeUrl: {
      type: String,
    },
    content: {
      type: String,
    },
    learningObjectives: [
      {
        type: String,
      },
    ],

    // Quiz-specific fields
    questions: [questionSchema],
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    passingScore: {
      type: Number, // percentage
      default: 70,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    showAnswers: {
      type: Boolean,
      default: false,
    },

    // Material-specific fields
    fileUrl: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },

    // Common metadata
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
resourceSchema.index({ teacher: 1, type: 1 });
resourceSchema.index({ subject: 1, difficulty: 1 });
resourceSchema.index({ isPublic: 1, isPublished: 1 });

module.exports = mongoose.model("Resource", resourceSchema);
