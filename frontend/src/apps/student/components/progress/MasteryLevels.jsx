import React from "react";

const MasteryLevels = () => {
  const subjects = [
    {
      name: "Mathematics",
      level: "Advanced",
      progress: 85,
      nextLevel: "Expert",
      pointsToNext: 150,
      icon: "🧮",
    },
    {
      name: "Physics",
      level: "Intermediate",
      progress: 65,
      nextLevel: "Advanced",
      pointsToNext: 350,
      icon: "⚛️",
    },
    {
      name: "Chemistry",
      level: "Basic",
      progress: 45,
      nextLevel: "Intermediate",
      pointsToNext: 550,
      icon: "🧪",
    },
    {
      name: "Biology",
      level: "Intermediate",
      progress: 72,
      nextLevel: "Advanced",
      pointsToNext: 280,
      icon: "🧬",
    },
    {
      name: "English",
      level: "Expert",
      progress: 90,
      nextLevel: "Master",
      pointsToNext: 1000,
      icon: "📚",
    },
  ];

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "basic":
        return "text-red-600 bg-red-100";
      case "intermediate":
        return "text-yellow-600 bg-yellow-100";
      case "advanced":
        return "text-green-600 bg-green-100";
      case "expert":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mastery Levels</h2>

      <div className="space-y-6">
        {subjects.map((subject, index) => (
          <div
            key={index}
            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{subject.icon}</span>
                <h3 className="font-semibold text-gray-900">{subject.name}</h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(
                  subject.level
                )}`}
              >
                {subject.level}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${subject.progress}%`,
                  backgroundColor:
                    subject.level.toLowerCase() === "basic"
                      ? "#ef4444"
                      : subject.level.toLowerCase() === "intermediate"
                      ? "#eab308"
                      : subject.level.toLowerCase() === "advanced"
                      ? "#22c55e"
                      : "#a855f7",
                }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{subject.progress}% Mastery</span>
              <span>
                {subject.pointsToNext} points to {subject.nextLevel}
              </span>
            </div>

            {/* Recommendations */}
            {subject.level.toLowerCase() === "basic" && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  💡 Focus on fundamental concepts. Try completing basic
                  exercises first.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Overall Mastery Progress
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-blue-600">68% Average Mastery</span>
          <span className="text-sm text-blue-700">
            🎯 On track for excellence
          </span>
        </div>
      </div>
    </div>
  );
};

export default MasteryLevels;
