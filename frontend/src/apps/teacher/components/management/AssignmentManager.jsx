import React, { useState, useEffect } from "react";
import Button from "../../../../shared/components/ui/Button";
import { assignmentService } from "../../../../shared/services/assignmentService";
import { useNotification } from "../../../../shared/hooks/useNotification";

const AssignmentManager = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState({
    active: [],
    draft: [],
    completed: [],
  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    maxScore: 100,
    instructions: "",
    class: "",
    status: "draft",
  });

  // Fetch assignments on component mount and tab change
  useEffect(() => {
    fetchAssignments();
  }, [activeTab]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const filters = { status: activeTab };
      const response = await assignmentService.getTeacherAssignments(filters);
      setAssignments((prev) => ({
        ...prev,
        [activeTab]: response.data.assignments || [],
      }));
    } catch (error) {
      console.error("Error fetching assignments:", error);
      showNotification("error", "Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAssignment) {
        await assignmentService.updateAssignment(
          editingAssignment._id,
          formData
        );
        showNotification("success", "Assignment updated successfully");
      } else {
        await assignmentService.createAssignment(formData);
        showNotification("success", "Assignment created successfully");
      }

      resetForm();
      setShowCreateForm(false);
      setShowEditForm(false);
      setEditingAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save assignment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIXED: Proper input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked ? "active" : "draft",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      subject: assignment.subject,
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : "",
      maxScore: assignment.maxScore || 100,
      instructions: assignment.instructions || "",
      class: assignment.class?._id || "",
      status: assignment.status,
    });
    setShowEditForm(true);
  };

  const handlePublish = async (assignment) => {
    try {
      await assignmentService.publishAssignment(assignment._id);
      showNotification(
        "success",
        `Assignment ${
          assignment.status === "active" ? "unpublished" : "published"
        } successfully`
      );
      fetchAssignments();
    } catch (error) {
      console.error("Error publishing assignment:", error);
      showNotification("error", "Failed to update assignment status");
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    try {
      await assignmentService.deleteAssignment(assignmentId);
      showNotification("success", "Assignment deleted successfully");
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showNotification("error", "Failed to delete assignment");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      dueDate: "",
      maxScore: 100,
      instructions: "",
      class: "",
      status: "draft",
    });
    setEditingAssignment(null);
  };

  const AssignmentForm = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Assignment" : "Create New Assignment"}
          </h3>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setShowEditForm(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              placeholder="Enter assignment title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              placeholder="Describe the assignment..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              placeholder="Provide detailed instructions for students..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Score
            </label>
            <input
              type="number"
              name="maxScore"
              value={formData.maxScore}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              placeholder="100"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="status" // Added name attribute
                checked={formData.status === "active"}
                onChange={handleInputChange} // Use the same handler
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">
                Publish immediately
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setShowEditForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? "Update Assignment"
                : "Create Assignment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ... rest of the component remains the same
  const renderAssignmentCard = (assignment) => (
    <div
      key={assignment._id}
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {assignment.subject} • Due:{" "}
            {new Date(assignment.dueDate).toLocaleDateString()} at{" "}
            {new Date(assignment.dueDate).toLocaleTimeString()}
          </p>
          {assignment.class?.name && (
            <p className="text-sm text-gray-500 mt-1">
              Class: {assignment.class.name}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">
            {assignment.submissionCount || 0} submissions
          </p>
          {assignment.averageScore > 0 && (
            <p className="text-sm font-medium text-green-600">
              Avg: {assignment.averageScore}%
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-2 mt-3">
        <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors duration-200">
          📊 View Submissions
        </button>
        <button
          onClick={() => handleEdit(assignment)}
          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => handlePublish(assignment)}
          className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors duration-200"
        >
          {assignment.status === "active" ? "⏸️ Unpublish" : "🚀 Publish"}
        </button>
        <button
          onClick={() => handleDelete(assignment._id)}
          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors duration-200"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );

  if (isLoading && assignments[activeTab].length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assignment Manager</h2>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create Assignment</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {["active", "draft", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} (
              {assignments[tab]?.length || 0})
            </button>
          ))}
        </nav>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments[activeTab]?.length > 0 ? (
          assignments[activeTab].map(renderAssignmentCard)
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} assignments
            </h3>
            <p className="text-gray-600">
              {activeTab === "draft"
                ? "Start creating your first assignment draft!"
                : `You don't have any ${activeTab} assignments yet.`}
            </p>
            {activeTab === "draft" && (
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
                className="mt-4"
              >
                Create Your First Assignment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">
            {assignments.active.length}
          </div>
          <div className="text-sm text-blue-700 font-medium">Active</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">
            {assignments.draft.length}
          </div>
          <div className="text-sm text-yellow-700 font-medium">Drafts</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">
            {assignments.completed.length}
          </div>
          <div className="text-sm text-green-700 font-medium">Completed</div>
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && <AssignmentForm />}
      {showEditForm && <AssignmentForm isEdit={true} />}
    </div>
  );
};

export default AssignmentManager;
