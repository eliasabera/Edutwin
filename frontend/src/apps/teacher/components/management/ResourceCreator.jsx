import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../shared/context/AuthContext";
import { resourceService } from "../../../../shared/services/resourceService";
import Button from "../../../../shared/components/ui/Button";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";

const ResourceCreator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("lessons");
  const [resources, setResources] = useState({
    lessons: [],
    quizzes: [],
    materials: [],
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Base form data
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    type: "lesson",
    difficulty: "intermediate",
    duration: 30,
    isPublic: false,
    tags: [],
  });

  // Lesson-specific data
  const [lessonData, setLessonData] = useState({
    youtubeUrl: "",
    content: "",
    learningObjectives: [],
  });

  // Quiz-specific data
  const [quizData, setQuizData] = useState({
    questions: [],
    timeLimit: 30,
    passingScore: 70,
    maxAttempts: 3,
    showAnswers: false,
  });

  // Material-specific data
  const [materialData, setMaterialData] = useState({
    file: null,
    fileUrl: "",
    fileType: "",
  });

  // Current question for quiz
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    explanation: "",
  });

  // Fetch teacher's resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getTeacherResources();
      setResources(response.data);
    } catch (err) {
      setError("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      let resourceData = { ...formData };

      // Add type-specific data
      switch (formData.type) {
        case "lesson":
          resourceData = { ...resourceData, ...lessonData };
          break;
        case "quiz":
          resourceData = {
            ...resourceData,
            ...quizData,
            questions: quizData.questions.map((q, index) => ({
              ...q,
              order: index + 1,
            })),
          };
          break;
        case "material":
          resourceData = { ...resourceData, ...materialData };
          break;
      }

      await resourceService.createResource({
        ...resourceData,
        teacher: user._id,
      });

      setSuccess("Resource created successfully!");
      resetForm();
      await fetchResources();
    } catch (err) {
      setError(err.message || "Failed to create resource");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      description: "",
      type: "lesson",
      difficulty: "intermediate",
      duration: 30,
      isPublic: false,
      tags: [],
    });
    setLessonData({
      youtubeUrl: "",
      content: "",
      learningObjectives: [],
    });
    setQuizData({
      questions: [],
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      showAnswers: false,
    });
    setMaterialData({
      file: null,
      fileUrl: "",
      fileType: "",
    });
    setCurrentQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      explanation: "",
    });
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;

    try {
      await resourceService.deleteResource(resourceId);
      setSuccess("Resource deleted successfully!");
      await fetchResources();
    } catch (err) {
      setError("Failed to delete resource");
    }
  };

  // Quiz question handlers
  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError("Please enter a question");
      return;
    }

    if (
      currentQuestion.type === "multiple-choice" &&
      !currentQuestion.correctAnswer
    ) {
      setError("Please select a correct answer");
      return;
    }

    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }],
    }));

    setCurrentQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      explanation: "",
    });
  };

  const removeQuestion = (index) => {
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate file upload (in real app, upload to cloud storage)
    const fileUrl = URL.createObjectURL(file);
    setMaterialData({
      file,
      fileUrl,
      fileType: file.type,
    });
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      e.target.value = "";
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addLearningObjective = () => {
    const objective = prompt("Enter learning objective:");
    if (objective && objective.trim()) {
      setLessonData((prev) => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objective.trim()],
      }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <LoadingSpinner text="Loading resources..." />
      </div>
    );
  }

  const renderResourceForm = () => {
    switch (formData.type) {
      case "lesson":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL (optional)
              </label>
              <input
                type="url"
                value={lessonData.youtubeUrl}
                onChange={(e) =>
                  setLessonData({ ...lessonData, youtubeUrl: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content *
              </label>
              <textarea
                value={lessonData.content}
                onChange={(e) =>
                  setLessonData({ ...lessonData, content: e.target.value })
                }
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the lesson content..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives
              </label>
              <div className="space-y-2">
                {lessonData.learningObjectives.map((objective, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm">• {objective}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLessonData({
                          ...lessonData,
                          learningObjectives:
                            lessonData.learningObjectives.filter(
                              (_, i) => i !== index
                            ),
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLearningObjective}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Learning Objective
                </button>
              </div>
            </div>
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-6">
            {/* Quiz Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  value={quizData.timeLimit}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      timeLimit: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="180"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={quizData.passingScore}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      passingScore: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={quizData.maxAttempts}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      maxAttempts: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizData.showAnswers}
                  onChange={(e) =>
                    setQuizData({ ...quizData, showAnswers: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show answers after quiz
                </span>
              </label>
            </div>

            {/* Question Builder */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Add Questions
              </h4>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        question: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          type: e.target.value,
                          options:
                            e.target.value === "multiple-choice"
                              ? ["", "", "", ""]
                              : [],
                          correctAnswer: "",
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          points: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Options for multiple choice */}
                {currentQuestion.type === "multiple-choice" && (
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={
                            currentQuestion.correctAnswer === `option${index}`
                          }
                          onChange={() =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              correctAnswer: `option${index}`,
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Options for true/false */}
                {currentQuestion.type === "true-false" && (
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === "true"}
                          onChange={() =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              correctAnswer: "true",
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">True</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === "false"}
                          onChange={() =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              correctAnswer: "false",
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          False
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Answer for short answer and essay */}
                {(currentQuestion.type === "short-answer" ||
                  currentQuestion.type === "essay") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Answer
                    </label>
                    <textarea
                      value={currentQuestion.correctAnswer}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter expected answer..."
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        explanation: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this answer is correct..."
                  />
                </div>

                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="primary"
                  className="w-full"
                >
                  Add Question
                </Button>
              </div>

              {/* Questions List */}
              {quizData.questions.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Questions ({quizData.questions.length})
                  </h5>
                  <div className="space-y-3">
                    {quizData.questions.map((question, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {question.question}
                            </p>
                            <p className="text-xs text-gray-600 capitalize">
                              {question.type} • {question.points} point(s)
                            </p>
                          </div>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "material":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {materialData.file ? (
                  <div>
                    <p className="font-medium text-gray-900">File selected:</p>
                    <p className="text-sm text-gray-600">
                      {materialData.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {materialData.fileType}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMaterialData({
                          file: null,
                          fileUrl: "",
                          fileType: "",
                        })
                      }
                      className="text-red-600 hover:text-red-700 text-sm mt-2"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop file here or
                    </p>
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700">
                      Choose File
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                        required
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: PDF, DOC, PPT, TXT, ZIP (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the study material..."
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Resource Creator
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {["lessons", "quizz", "materials"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setFormData((prev) => ({ ...prev, type: tab.slice(0, -1) }));
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} (
              {resources[tab]?.length || 0})
            </button>
          ))}
        </nav>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Form */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">
            Create New{" "}
            {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${formData.type} title`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="History">History</option>
              </select>
            </div>

            {formData.type !== "material" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Describe the ${formData.type}...`}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({ ...formData, difficulty: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  min="5"
                  max="240"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                onKeyPress={handleTagInput}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type and press Enter to add tags"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this resource public
                </span>
              </label>
            </div>

            {/* Type-specific fields */}
            {renderResourceForm()}

            <Button
              type="submit"
              variant="primary"
              loading={creating}
              className="w-full"
              disabled={
                formData.type === "quiz" && quizData.questions.length === 0
              }
            >
              {formData.type === "quiz" && quizData.questions.length === 0
                ? "Add at least one question"
                : `Create ${
                    formData.type.charAt(0).toUpperCase() +
                    formData.type.slice(1)
                  }`}
            </Button>
          </form>
        </div>

        {/* Resources List */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Your Resources</h3>
          <div className="space-y-3">
            {resources[activeTab]?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No {activeTab} created yet</p>
                <p className="text-sm">
                  Create your first resource to get started
                </p>
              </div>
            ) : (
              resources[activeTab]?.map((resource) => (
                <div
                  key={resource._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {resource.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {resource.subject}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        resource.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {resource.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {resource.description}
                  </p>

                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>👀 {resource.views || 0}</span>
                      {resource.type === "quiz" && (
                        <span>📝 {resource.attempts || 0}</span>
                      )}
                      {resource.type === "material" && (
                        <span>📥 {resource.downloads || 0}</span>
                      )}
                      <span>⏱️ {resource.duration}min</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {resource.difficulty}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                      {resource.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                      Share
                    </button>
                    <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resource._id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCreator;
