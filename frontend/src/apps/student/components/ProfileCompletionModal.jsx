import React, { useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import { api } from "../../../shared/services/api";
import Modal from "../../../shared/components/ui/Modal";
import Button from "../../../shared/components/ui/Button";

const ProfileCompletionModal = ({ isOpen, onComplete }) => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    gradeLevel: "",
    dateOfBirth: "",
    school: "",
    learningStyle: "visual",
    subjects: [],
  });

  const steps = [
    { number: 1, title: "Basic Information" },
    { number: 2, title: "Academic Details" },
    { number: 3, title: "Learning Preferences" },
  ];

  const handleSubmit = async () => {
    try {
      await api.put(`/students/${user._id}/profile`, formData);
      await updateUser(); // Refresh user data
      onComplete();
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Complete Your Profile"
      size="large"
    >
      {/* Progress Steps */}
      <div className="flex justify-center mb-6">
        {steps.map((step) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step.number
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.number}
            </div>
            <span
              className={`ml-2 text-sm ${
                currentStep >= step.number
                  ? "text-blue-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              {step.title}
            </span>
            {step.number < steps.length && (
              <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
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
              placeholder="Enter your school name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Step 2: Academic Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
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
                  <span className="ml-2 text-sm text-gray-700">{subject}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Learning Preferences */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Style
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "visual",
                  label: "👀 Visual Learner",
                  description: "Learn best with images, diagrams, and videos",
                },
                {
                  value: "auditory",
                  label: "👂 Auditory Learner",
                  description: "Learn best through listening and discussions",
                },
                {
                  value: "kinesthetic",
                  label: "✋ Kinesthetic Learner",
                  description: "Learn best through hands-on activities",
                },
                {
                  value: "reading",
                  label: "📖 Reading/Writing Learner",
                  description: "Learn best through reading and writing",
                },
              ].map((style) => (
                <label
                  key={style.value}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="learningStyle"
                    value={style.value}
                    checked={formData.learningStyle === style.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        learningStyle: e.target.value,
                      })
                    }
                    className="mt-1 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">
                      {style.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {style.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={handleBack}
          variant="outline"
          disabled={currentStep === 1}
        >
          Back
        </Button>

        <Button onClick={handleNext} variant="primary">
          {currentStep === steps.length ? "Complete Profile" : "Next"}
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileCompletionModal;
