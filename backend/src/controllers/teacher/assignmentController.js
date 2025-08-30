const Assignment = require("../../models/Assignment");
const Class = require("../../models/Class");

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
const createAssignment = async (req, res) => {
  try {
    const { class: classId, ...assignmentData } = req.body;

    // Verify the teacher owns the class
    const teacherClass = await Class.findOne({
      _id: classId,
      teacher: req.user.id,
    });

    if (!teacherClass) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create assignments for this class",
      });
    }

    const assignment = await Assignment.create({
      ...assignmentData,
      teacher: req.user.id,
      class: classId,
    });

    // Populate teacher and class info
    await assignment.populate("teacher", "firstName lastName");
    await assignment.populate("class", "name subject");

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: { assignment },
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during assignment creation",
    });
  }
};

// @desc    Get teacher's assignments
// @route   GET /api/assignments/teacher/my-assignments
// @access  Private (Teacher)
const getTeacherAssignments = async (req, res) => {
  try {
    const { status, subject, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = { teacher: req.user.id };
    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    const assignments = await Assignment.find(filter)
      .sort({ dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("teacher", "firstName lastName")
      .populate("class", "name");

    const total = await Assignment.countDocuments(filter);

    res.json({
      success: true,
      data: { assignments },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    console.error("Get teacher assignments error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private (Teacher)
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("teacher", "firstName lastName email")
      .populate("class", "name subject")
      .populate("submissions.student", "firstName lastName");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Check if teacher owns the assignment
    if (assignment.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher)
const updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Check if teacher owns the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("teacher", "firstName lastName");

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: { assignment },
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during assignment update",
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Check if teacher owns the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assignment",
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during assignment deletion",
    });
  }
};

// @desc    Publish/Unpublish assignment
// @route   PATCH /api/assignments/:id/publish
// @access  Private (Teacher)
const publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Check if teacher owns the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this assignment",
      });
    }

    assignment.status = assignment.status === "active" ? "draft" : "active";
    await assignment.save();

    res.json({
      success: true,
      message: `Assignment ${
        assignment.status === "active" ? "published" : "unpublished"
      } successfully`,
      data: { assignment },
    });
  } catch (error) {
    console.error("Publish assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during assignment publication",
    });
  }
};

module.exports = {
  createAssignment,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
};
