import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../hooks/useNotification";
import Button from "../components/ui/Button";

const ProfileCompletion = () => {
  const { user, updateProfile } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    avatar: user?.avatar || "",
    phone: "",
    bio: "",

    // Student-specific
    gradeLevel: "",
    dateOfBirth: "",
    school: "",
    learningStyle: "visual",

    // Teacher-specific
    subjects: [],
    qualifications: {
      degree: "",
      certification: "",
      yearsExperience: 0,
    },
    school: "",
    teachingStyle: "hybrid",
  });

  const [selectedClasses, setSelectedClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    // Fetch available classes based on user role
    fetchAvailableClasses();
  }, [user?.role]);

  const fetchAvailableClasses = async () => {
    try {
      // This would be an API call to fetch classes
      const mockClasses = [
        {
          _id: "1",
          name: "Mathematics 101",
          subject: "Mathematics",
          gradeLevel: "Grade 10",
        },
        {
          _id: "2",
          name: "Physics Advanced",
          subject: "Physics",
          gradeLevel: "Grade 11",
        },
        {
          _id: "3",
          name: "Chemistry Basics",
          subject: "Chemistry",
          gradeLevel: "Grade 9",
        },
      ];
      setAvailableClasses(mockClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const calculateCompletion = () => {
    let completed = 0;
    const total = user?.role === "student" ? 8 : 7;

    if (formData.avatar) completed++;
    if (formData.phone) completed++;
    if (formData.bio) completed++;

    if (user?.role === "student") {
      if (formData.gradeLevel) completed++;
      if (formData.dateOfBirth) completed++;
      if (formData.school) completed++;
      if (selectedClasses.length > 0) completed++;
    } else if (user?.role === "teacher") {
      if (formData.subjects.length > 0) completed++;
      if (formData.qualifications.degree) completed++;
      if (formData.school) completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const completionData = {
        ...formData,
        profileCompletion: calculateCompletion(),
        profileComplete: calculateCompletion() >= 80,
        ...(user?.role === "student" && { classes: selectedClasses }),
      };

      await updateProfile(completionData);
      showNotification("success", "Profile updated successfully!");
      navigate(`/${user.role}/dashboard`);
    } catch (error) {
      showNotification("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              {completionPercentage === 100
                ? "Your profile is complete! 🎉"
                : `Complete your profile to unlock all features (${completionPercentage}% done)`}
            </p>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Role-specific Fields */}
            {user?.role === "student" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Level
                    </label>
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, gradeLevel: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select grade</option>
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
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Style
                    </label>
                    <select
                      value={formData.learningStyle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          learningStyle: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="visual">Visual</option>
                      <option value="auditory">Auditory</option>
                      <option value="kinesthetic">Kinesthetic</option>
                      <option value="reading">Reading/Writing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    placeholder="Your school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Classes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableClasses.map((classItem) => (
                      <label
                        key={classItem._id}
                        className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classItem._id)}
                          onChange={() => handleClassToggle(classItem._id)}
                          className="mr-3 text-blue-600 focus:ring-blue-600"
                        />
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          <div className="text-sm text-gray-600">
                            {classItem.subject} • {classItem.gradeLevel}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {user?.role === "teacher" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects You Teach
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      "Mathematics",
                      "Physics",
                      "Chemistry",
                      "Biology",
                      "English",
                      "History",
                    ].map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={(e) => {
                            const newSubjects = e.target.checked
                              ? [...formData.subjects, subject]
                              : formData.subjects.filter((s) => s !== subject);
                            setFormData({ ...formData, subjects: newSubjects });
                          }}
                          className="mr-2 text-blue-600 focus:ring-blue-600"
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Highest Degree
                    </label>
                    <input
                      type="text"
                      value={formData.qualifications.degree}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualifications: {
                            ...formData.qualifications,
                            degree: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                      placeholder="e.g., Master's in Education"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.qualifications.yearsExperience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualifications: {
                            ...formData.qualifications,
                            yearsExperience: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Style
                  </label>
                  <select
                    value={formData.teachingStyle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        teachingStyle: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="traditional">Traditional</option>
                    <option value="progressive">Progressive</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/${user.role}/dashboard`)}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={completionPercentage < 20}
              >
                {completionPercentage === 100
                  ? "Complete Profile"
                  : "Save Progress"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
