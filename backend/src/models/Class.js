const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [100, "Class name cannot exceed 100 characters"],
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
        "Art",
        "Music",
        "Physical Education",
        "Economics",
        "Psychology",
        "Sociology",
        "Business Studies",
      ],
    },
    gradeLevel: {
      type: String,
      required: [true, "Grade level is required"],
      enum: [
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
        "University",
        "Adult Education",
      ],
    },
    section: {
      type: String,
      trim: true,
      maxlength: [10, "Section cannot exceed 10 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher is required"],
    },
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "inactive", "suspended"],
          default: "active",
        },
      },
    ],
    schedule: {
      days: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
      ],
      startTime: String, // Format: "HH:MM"
      endTime: String, // Format: "HH:MM"
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, "Room number cannot exceed 50 characters"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      match: [/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"],
    },
    semester: {
      type: String,
      enum: [
        "First Semester",
        "Second Semester",
        "Third Semester",
        "Summer",
        "Full Year",
      ],
      default: "Full Year",
    },
    capacity: {
      type: Number,
      min: [1, "Capacity must be at least 1"],
      max: [100, "Capacity cannot exceed 100"],
      default: 30,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness among non-null values
    },
    settings: {
      allowStudentUploads: {
        type: Boolean,
        default: true,
      },
      allowDiscussion: {
        type: Boolean,
        default: true,
      },
      showGrades: {
        type: Boolean,
        default: true,
      },
      autoApproveEnrollment: {
        type: Boolean,
        default: false,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, "Tag cannot exceed 20 characters"],
      },
    ],
    coverImage: {
      url: String,
      alt: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for student count
classSchema.virtual("studentCount").get(function () {
  return this.students.filter((student) => student.status === "active").length;
});

// Virtual for available slots
classSchema.virtual("availableSlots").get(function () {
  return Math.max(0, this.capacity - this.enrollmentCount);
});

// Index for better query performance
classSchema.index({ teacher: 1, isActive: 1 });
classSchema.index({ subject: 1, gradeLevel: 1 });
classSchema.index({ joinCode: 1 }, { unique: true, sparse: true });
classSchema.index({ academicYear: 1, semester: 1 });

// Pre-save middleware to generate join code
classSchema.pre("save", async function (next) {
  if (this.isNew && !this.joinCode) {
    this.joinCode = await this.generateJoinCode();
  }
  next();
});

// Method to generate unique join code
classSchema.methods.generateJoinCode = async function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code is unique
    const existingClass = await mongoose
      .model("Class")
      .findOne({ joinCode: code });
    if (!existingClass) {
      isUnique = true;
    }
  }

  return code;
};

// Method to check if student is enrolled
classSchema.methods.isStudentEnrolled = function (studentId) {
  return this.students.some(
    (enrollment) =>
      enrollment.student.toString() === studentId.toString() &&
      enrollment.status === "active"
  );
};

// Method to add student to class
classSchema.methods.addStudent = function (studentId) {
  if (this.enrollmentCount >= this.capacity) {
    throw new Error("Class capacity reached");
  }

  if (!this.isStudentEnrolled(studentId)) {
    this.students.push({
      student: studentId,
      status: "active",
    });
    this.enrollmentCount = this.students.filter(
      (s) => s.status === "active"
    ).length;
  }
};

// Method to remove student from class
classSchema.methods.removeStudent = function (studentId) {
  const studentIndex = this.students.findIndex(
    (enrollment) => enrollment.student.toString() === studentId.toString()
  );

  if (studentIndex > -1) {
    this.students[studentIndex].status = "inactive";
    this.enrollmentCount = this.students.filter(
      (s) => s.status === "active"
    ).length;
  }
};

// Static method to find classes by teacher
classSchema.statics.findByTeacher = function (teacherId, filters = {}) {
  return this.find({ teacher: teacherId, ...filters })
    .populate("teacher", "firstName lastName email")
    .populate("students.student", "firstName lastName email");
};

// Static method to find active classes
classSchema.statics.findActiveClasses = function () {
  return this.find({ isActive: true })
    .populate("teacher", "firstName lastName")
    .populate("students.student", "firstName lastName");
};

module.exports = mongoose.model("Class", classSchema);
