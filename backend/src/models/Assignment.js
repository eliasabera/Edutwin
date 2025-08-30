const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "English",
        "History",
        "Geography",
        "Computer Science",
      ],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    maxScore: {
      type: Number,
      default: 100,
      min: [0, "Score cannot be negative"],
    },
    instructions: {
      type: String,
      maxlength: [2000, "Instructions cannot exceed 2000 characters"],
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    submissions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        fileUrl: String,
        score: Number,
        feedback: String,
        gradedAt: Date,
      },
    ],
    averageScore: {
      type: Number,
      default: 0,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Update average score when submissions are modified
assignmentSchema.methods.updateAverageScore = function () {
  const gradedSubmissions = this.submissions.filter(
    (sub) => sub.score !== undefined
  );
  if (gradedSubmissions.length > 0) {
    this.averageScore =
      gradedSubmissions.reduce((sum, sub) => sum + sub.score, 0) /
      gradedSubmissions.length;
  }
};

module.exports = mongoose.model("Assignment", assignmentSchema);
