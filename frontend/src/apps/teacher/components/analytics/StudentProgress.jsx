import React, { useState } from "react";
import ProgressBar from "../../../../shared/components/ui/ProgressBar";

const StudentProgress = () => {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");

  const students = [
    {
      id: 1,
      name: "Alemu Tekle",
      subjects: {
        Mathematics: { score: 92, progress: 95 },
        Physics: { score: 85, progress: 88 },
        Chemistry: { score: 78, progress: 82 },
      },
      attendance: "96%",
    },
    {
      id: 2,
      name: "Birtukan Haile",
      subjects: {
        Mathematics: { score: 88, progress: 90 },
        Physics: { score: 92, progress: 94 },
        Chemistry: { score: 85, progress: 87 },
      },
      attendance: "100%",
    },
    {
      id: 3,
      name: "Dawit Mekonnen",
      subjects: {
        Mathematics: { score: 65, progress: 70 },
        Physics: { score: 72, progress: 75 },
        Chemistry: { score: 68, progress: 72 },
      },
      attendance: "88%",
    },
    {
      id: 4,
      name: "Elena Assefa",
      subjects: {
        Mathematics: { score: 95, progress: 98 },
        Physics: { score: 89, progress: 92 },
        Chemistry: { score: 91, progress: 94 },
      },
      attendance: "92%",
    },
  ];

  const subjects = ["Mathematics", "Physics", "Chemistry"];

  const getPerformanceColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Progress</h2>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {students.map((student) => {
          const subjectData = student.subjects[selectedSubject];
          return (
            <div
              key={student.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Attendance: {student.attendance}
                  </p>
                </div>
                <span
                  className={`font-bold ${getPerformanceColor(
                    subjectData.score
                  )}`}
                >
                  {subjectData.score}%
                </span>
              </div>

              <ProgressBar
                progress={subjectData.progress}
                color={
                  subjectData.score >= 80
                    ? "green"
                    : subjectData.score >= 70
                    ? "yellow"
                    : "red"
                }
                showPercentage={true}
              />

              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Current Progress</span>
                <span>{subjectData.progress}% Mastery</span>
              </div>

              <div className="mt-3 flex space-x-2">
                <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                  Send Message
                </button>
                <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">
          📊 Class Summary - {selectedSubject}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-2xl font-bold text-blue-600">82%</div>
            <div className="text-gray-600">Class Average</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">12%</div>
            <div className="text-gray-600">Improvement</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-gray-600">Need Help</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
