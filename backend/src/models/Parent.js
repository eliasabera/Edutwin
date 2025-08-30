// models/Parent.js
const mongoose = require("mongoose");
const User = require("./User");

const parentSchema = new mongoose.Schema({
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  ],
  relationship: {
    type: String,
    enum: ["mother", "father", "guardian", "other"],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  notificationPreferences: {
    academicUpdates: { type: Boolean, default: true },
    behaviorAlerts: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
  },
  communicationLanguage: {
    type: String,
    default: "en",
  },
});

module.exports = User.discriminator("Parent", parentSchema);
