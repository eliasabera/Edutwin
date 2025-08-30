// models/Course.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: true,
      enum: [
        "math",
        "science",
        "english",
        "history",
        "art",
        "music",
        "physical-education",
      ],
    },
    gradeLevel: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    learningObjectives: [String],
    prerequisites: [String],
    coverImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ subject: 1, gradeLevel: 1 });

module.exports = mongoose.model("Course", courseSchema);
