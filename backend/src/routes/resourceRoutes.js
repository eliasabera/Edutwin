const express = require("express");
const router = express.Router();
const {
  createResource,
  getTeacherResources,
  getResourceById,
  updateResource,
  deleteResource,
  publishResource,
  getPublicResources,
  getResourcesBySubject,
  incrementViews,
  incrementDownloads,
  rateResource,
} = require("../controllers/teacher/resourceController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/public", getPublicResources);
router.get("/subject/:subject", getResourcesBySubject);
router.get("/:id/view", incrementViews);

// Protected routes
router.use(protect);

// Teacher-only routes
router.use(authorize("teacher"));
router.post("/", createResource);
router.get("/teacher/my-resources", getTeacherResources);
router.get("/:id", getResourceById);
router.put("/:id", updateResource);
router.delete("/:id", deleteResource);
router.patch("/:id/publish", publishResource);

// Student and teacher routes
router.patch("/:id/download", incrementDownloads);
router.post("/:id/rate", rateResource);

module.exports = router;
