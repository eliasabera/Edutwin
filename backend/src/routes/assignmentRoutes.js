const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
} = require("../controllers/teacher/assignmentController");
const { protect, authorize } = require("../middleware/auth");

// All routes protected
router.use(protect);

// Teacher-only routes
router.use(authorize("teacher"));
router.post("/", createAssignment);
router.get("/teacher/my-assignments", getTeacherAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);
router.patch("/:id/publish", publishAssignment);

module.exports = router;
