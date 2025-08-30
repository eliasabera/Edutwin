import React from "react";
import ProgressBar from "../../../../shared/components/ui/ProgressBar";

const KnowledgeMeter = ({ subjects = [] }) => {
  // Sample data - replace with actual API data
  const sampleSubjects = [
    { name: "Mathematics", progress: 85, understanding: "advanced" },
    { name: "Physics", progress: 65, understanding: "intermediate" },
    { name: "Chemistry", progress: 45, understanding: "basic" },
    { name: "Biology", progress: 72, understanding: "intermediate" },
    { name: "English", progress: 90, understanding: "expert" },
  ];

  const subjectsData = subjects.length > 0 ? subjects : sampleSubjects;

  const getUnderstandingColor = (level) => {
    switch (level) {
      case "basic":
        return "red";
      case "intermediate":
        return "yellow";
      case "advanced":
        return "green";
      case "expert":
        return "purple";
      default:
        return "blue";
    }
  };

  const getUnderstandingIcon = (level) => {
    switch (level) {
      case "basic":
        return "🔴";
      case "intermediate":
        return "🟡";
      case "advanced":
        return "🟢";
      case "expert":
        return "🟣";
      default:
        return "🔵";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Knowledge Meter</h2>

      <div className="space-y-6">
        {subjectsData.map((subject, index) => (
          <div
            key={index}
            className="border-b border-gray-100 pb-4 last:border-b-0"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">
                {subject.name}
              </span>
              <span className="text-sm text-gray-600">
                {getUnderstandingIcon(subject.understanding)}{" "}
                {subject.understanding}
              </span>
            </div>

            <ProgressBar
              progress={subject.progress}
              color={getUnderstandingColor(subject.understanding)}
              size="medium"
              showPercentage={true}
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">
                Mastery: {subject.progress}%
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {subject.progress >= 80
                  ? "🏆 Excellent"
                  : subject.progress >= 60
                  ? "👍 Good"
                  : "📚 Needs practice"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <div className="text-blue-600 text-lg">💡</div>
          <p className="ml-3 text-sm text-blue-700">
            <strong>Tip:</strong> Focus on subjects below 60% for maximum
            improvement
          </p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMeter;
