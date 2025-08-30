const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateEmail,
  uploadAvatar,
  deleteAccount,
} = require("../controllers/shared/profileController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/email", updateEmail);
router.post("/avatar", uploadAvatar);
router.delete("/", deleteAccount);

module.exports = router;
