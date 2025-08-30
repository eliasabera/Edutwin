// models/Teacher.js
const mongoose = require("mongoose");
const User = require("./User");

const teacherSchema = new mongoose.Schema({
  subjects: [
    {
      type: String,
      required: true,
    },
  ],
  qualifications: {
    degree: String,
    certification: String,
    yearsExperience: Number,
  },
  school: {
    type: String,
    required: true,
  },
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  availability: {
    officeHours: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
  },
  teachingStyle: {
    type: String,
    enum: ["traditional", "progressive", "hybrid"],
    default: "hybrid",
  },
});

module.exports = User.discriminator("Teacher", teacherSchema);
