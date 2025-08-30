const Resource = require("../../models/Resource");

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private (Teacher)
const createResource = async (req, res) => {
  try {
    const { type } = req.body;

    // Validate based on resource type
    let validationErrors = [];

    switch (type) {
      case "lesson":
        if (!req.body.content) {
          validationErrors.push("Lesson content is required");
        }
        break;
      case "quiz":
        if (!req.body.questions || req.body.questions.length === 0) {
          validationErrors.push("At least one question is required for quiz");
        }
        // Validate each question
        if (req.body.questions) {
          req.body.questions.forEach((question, index) => {
            if (!question.question) {
              validationErrors.push(`Question ${index + 1} is required`);
            }
            if (!question.correctAnswer && question.type !== "essay") {
              validationErrors.push(
                `Correct answer is required for question ${index + 1}`
              );
            }
            if (
              question.type === "multiple-choice" &&
              (!question.options || question.options.length < 2)
            ) {
              validationErrors.push(
                `At least 2 options are required for multiple choice question ${
                  index + 1
                }`
              );
            }
          });
        }
        break;
      case "material":
        if (!req.body.fileUrl) {
          validationErrors.push("File upload is required for study material");
        }
        break;
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(", "),
      });
    }

    const resource = await Resource.create({
      ...req.body,
      teacher: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: { resource },
    });
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during resource creation",
    });
  }
};

// @desc    Get teacher's resources
// @route   GET /api/resources/teacher/my-resources
// @access  Private (Teacher)
const getTeacherResources = async (req, res) => {
  try {
    const { type, subject, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = { teacher: req.user.id };
    if (type) filter.type = type;
    if (subject) filter.subject = subject;

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("teacher", "firstName lastName");

    const total = await Resource.countDocuments(filter);

    // Group resources by type for the tab interface
    const groupedResources = {
      lessons: resources.filter((r) => r.type === "lesson"),
      quizz: resources.filter((r) => r.type === "quiz"),
      materials: resources.filter((r) => r.type === "material"),
    };

    res.json({
      success: true,
      data: groupedResources,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    console.error("Get teacher resources error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Private (Teacher)
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("teacher", "firstName lastName email")
      .populate("ratings.student", "firstName lastName");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if teacher owns the resource
    if (resource.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this resource",
      });
    }

    res.json({
      success: true,
      data: { resource },
    });
  } catch (error) {
    console.error("Get resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Teacher)
const updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if teacher owns the resource
    if (resource.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this resource",
      });
    }

    // Remove fields that shouldn't be updated
    const { teacher, views, downloads, attempts, ratings, ...updateData } =
      req.body;

    resource = await Resource.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Resource updated successfully",
      data: { resource },
    });
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during resource update",
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Teacher)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if teacher owns the resource
    if (resource.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this resource",
      });
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during resource deletion",
    });
  }
};

// @desc    Publish/Unpublish resource
// @route   PATCH /api/resources/:id/publish
// @access  Private (Teacher)
const publishResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if teacher owns the resource
    if (resource.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this resource",
      });
    }

    resource.isPublished = !resource.isPublished;
    await resource.save();

    res.json({
      success: true,
      message: `Resource ${
        resource.isPublished ? "published" : "unpublished"
      } successfully`,
      data: { resource },
    });
  } catch (error) {
    console.error("Publish resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during resource publication",
    });
  }
};

// @desc    Get public resources
// @route   GET /api/resources/public
// @access  Public
const getPublicResources = async (req, res) => {
  try {
    const {
      type,
      subject,
      difficulty,
      page = 1,
      limit = 12,
      search,
    } = req.query;

    // Build filter object
    const filter = {
      isPublic: true,
      isPublished: true,
    };

    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("teacher", "firstName lastName")
      .select("-questions.correctAnswer"); // Don't expose answers for public queries

    const total = await Resource.countDocuments(filter);

    res.json({
      success: true,
      data: { resources },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    console.error("Get public resources error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get resources by subject
// @route   GET /api/resources/subject/:subject
// @access  Public
const getResourcesBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const { type, difficulty, page = 1, limit = 10 } = req.query;

    const filter = {
      subject,
      isPublic: true,
      isPublished: true,
    };

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("teacher", "firstName lastName")
      .select("-questions.correctAnswer");

    const total = await Resource.countDocuments(filter);

    res.json({
      success: true,
      data: { resources },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    console.error("Get resources by subject error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Increment resource views
// @route   GET /api/resources/:id/view
// @access  Public
const incrementViews = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.json({
      success: true,
      message: "View counted",
      data: { views: resource.views },
    });
  } catch (error) {
    console.error("Increment views error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Increment resource downloads
// @route   PATCH /api/resources/:id/download
// @access  Private
const incrementDownloads = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.json({
      success: true,
      message: "Download counted",
      data: {
        downloads: resource.downloads,
        fileUrl: resource.fileUrl,
      },
    });
  } catch (error) {
    console.error("Increment downloads error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Rate resource
// @route   POST /api/resources/:id/rate
// @access  Private
const rateResource = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if student already rated this resource
    const existingRating = resource.ratings.find(
      (r) => r.student.toString() === req.user.id
    );

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
    } else {
      // Add new rating
      resource.ratings.push({
        student: req.user.id,
        rating,
        comment,
      });
    }

    // Calculate new average rating
    const totalRatings = resource.ratings.length;
    const sumRatings = resource.ratings.reduce((sum, r) => sum + r.rating, 0);
    resource.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    await resource.save();

    res.json({
      success: true,
      message: "Resource rated successfully",
      data: {
        averageRating: resource.averageRating,
        totalRatings: resource.ratings.length,
      },
    });
  } catch (error) {
    console.error("Rate resource error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during rating",
    });
  }
};

module.exports = {
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
};
