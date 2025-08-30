import React, { useState } from "react";
import ProgressBar from "../../../../shared/components/ui/ProgressBar";

const LessonViewer = ({ lesson }) => {
  const [currentSection, setCurrentSection] = useState(0);

  // Sample lesson data
  const sampleLesson = {
    title: "Introduction to Algebra",
    subject: "Mathematics",
    duration: "45 min",
    difficulty: "Intermediate",
    sections: [
      {
        title: "What is Algebra?",
        content:
          "Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.",
        type: "text",
      },
      {
        title: "Basic Concepts",
        content:
          "Variables, constants, expressions, and equations are the building blocks of algebra.",
        type: "text",
      },
      {
        title: "Example Problem",
        content: "Solve for x: 2x + 5 = 15",
        type: "problem",
        solution: "x = 5",
      },
    ],
  };

  const lessonData = lesson || sampleLesson;

  const progress = ((currentSection + 1) / lessonData.sections.length) * 100;

  const handleNext = () => {
    if (currentSection < lessonData.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Lesson Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {lessonData.title}
          </h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {lessonData.subject}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>⏱️ {lessonData.duration}</span>
          <span>📊 {lessonData.difficulty}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar progress={progress} />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>
            Section {currentSection + 1} of {lessonData.sections.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Current Section Content */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {lessonData.sections[currentSection].title}
        </h2>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {lessonData.sections[currentSection].content}
          </p>

          {lessonData.sections[currentSection].type === "problem" && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Try it yourself:</h4>
              <p className="text-gray-700">
                {lessonData.sections[currentSection].content}
              </p>
              <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Show Solution
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentSection === 0}
          className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          disabled={currentSection === lessonData.sections.length - 1}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {currentSection === lessonData.sections.length - 1
            ? "Complete Lesson"
            : "Next →"}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex space-x-3">
        <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
          📝 Take Notes
        </button>
        <button className="flex-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200">
          💬 Ask AI Tutor
        </button>
        <button className="flex-1 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200">
          ⭐ Rate Lesson
        </button>
      </div>
    </div>
  );
};

export default LessonViewer;
