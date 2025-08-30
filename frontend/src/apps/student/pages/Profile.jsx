import React, { useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import { api } from "../../../shared/services/api";
import Button from "../../../shared/components/ui/Button";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    gradeLevel: user.gradeLevel || "",
    dateOfBirth: user.dateOfBirth || "",
    school: user.school || "",
    learningStyle: user.learningStyle || "visual",
    subjects: user.subjects || [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${user._id}/profile`, formData);
      await updateUser();
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "primary"}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grade Level
                </label>
                <p className="mt-1 text-gray-900">
                  {user.gradeLevel || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <p className="mt-1 text-gray-900">
                  {user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                School
              </label>
              <p className="mt-1 text-gray-900">{user.school || "Not set"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Learning Style
              </label>
              <p className="mt-1 text-gray-900 capitalize">
                {user.learningStyle
                  ? user.learningStyle.replace("_", " ")
                  : "Not set"}
              </p>
            </div>

            {user.subjects && user.subjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Favorite Subjects
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade level</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your school name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Style
              </label>
              <select
                value={formData.learningStyle}
                onChange={(e) =>
                  setFormData({ ...formData, learningStyle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="visual">Visual Learner</option>
                <option value="auditory">Auditory Learner</option>
                <option value="kinesthetic">Kinesthetic Learner</option>
                <option value="reading">Reading/Writing Learner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Subjects
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Mathematics",
                  "Physics",
                  "Chemistry",
                  "Biology",
                  "English",
                  "History",
                ].map((subject) => (
                  <label key={subject} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={(e) => {
                        const subjects = e.target.checked
                          ? [...formData.subjects, subject]
                          : formData.subjects.filter((s) => s !== subject);
                        setFormData({ ...formData, subjects });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {subject}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
