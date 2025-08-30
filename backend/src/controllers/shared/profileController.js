const User = require("../../models/User");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Parent = require("../../models/Parent");

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          preferences: user.preferences,
          isProfileComplete: checkProfileComplete(user),
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove restricted fields
    delete updateData.password;
    delete updateData.role;
    delete updateData.email; // Email should be updated separately with verification

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          preferences: user.preferences,
          isProfileComplete: checkProfileComplete(user),
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during profile update",
    });
  }
};

// @desc    Update user email
// @route   PUT /api/profile/email
// @access  Private
const updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    user.email = email;
    user.isEmailVerified = false; // Require re-verification
    await user.save();

    // TODO: Send verification email

    res.json({
      success: true,
      message:
        "Email updated successfully. Please verify your new email address.",
    });
  } catch (error) {
    console.error("Update email error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during email update",
    });
  }
};

// @desc    Upload profile avatar
// @route   POST /api/profile/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    // This would handle file upload using multer or similar
    // For now, we'll assume the URL is provided in the request
    const { avatarUrl } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during avatar upload",
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/profile
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    user.email = `deleted-${Date.now()}@${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during account deletion",
    });
  }
};

// Helper function to check if profile is complete
const checkProfileComplete = (user) => {
  if (user.role === "student") {
    return !!(user.gradeLevel && user.dateOfBirth && user.school);
  }
  if (user.role === "teacher") {
    return !!(user.subjects && user.subjects.length > 0 && user.school);
  }
  if (user.role === "parent") {
    return !!(user.phoneNumber && user.relationship);
  }
  return false;
};

module.exports = {
  getProfile,
  updateProfile,
  updateEmail,
  uploadAvatar,
  deleteAccount,
};
