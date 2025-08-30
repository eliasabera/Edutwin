// models/Student.js
const mongoose = require("mongoose");
const User = require("./User");

const studentSchema = new mongoose.Schema({
  gradeLevel: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  parents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
    },
  ],
  learningStyle: {
    type: String,
    enum: ["visual", "auditory", "kinesthetic", "reading"],
    default: "visual",
  },
  currentCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  learningGoals: [
    {
      goal: String,
      targetDate: Date,
      completed: { type: Boolean, default: false },
    },
  ],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActive: Date,
  },
});

studentSchema.virtual("age").get(function () {
  return Math.floor(
    (Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000)
  );
});

module.exports = User.discriminator("Student", studentSchema);
