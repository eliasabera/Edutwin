import React, { useState } from "react";

const WeeklyReport = () => {
  const [selectedWeek, setSelectedWeek] = useState("2024-01-15");

  const weeklyReports = [
    {
      week: "2024-01-15",
      child: "Alemu Tekle",
      summary: "Excellent week with significant improvement in Mathematics",
      stats: {
        lessonsCompleted: 8,
        quizzesTaken: 3,
        averageScore: "88%",
        timeSpent: "12.5 hours",
        attendance: "100%",
      },
      achievements: [
        "Mathematics Mastery Badge",
        "Perfect Attendance",
        "Quick Learner Award",
      ],
      areasToImprove: ["Chemistry problem-solving", "Time management in exams"],
      teacherComments:
        "Alemu is showing remarkable progress in Mathematics. Keep encouraging his interest in problem-solving.",
    },
    {
      week: "2024-01-08",
      child: "Alemu Tekle",
      summary: "Good progress with consistent performance",
      stats: {
        lessonsCompleted: 7,
        quizzesTaken: 2,
        averageScore: "82%",
        timeSpent: "10.2 hours",
        attendance: "100%",
      },
      achievements: ["Consistent Performer", "Active Participation"],
      areasToImprove: ["Physics concepts", "Homework submission timing"],
      teacherComments:
        "Solid performance overall. Focus on physics concepts next week.",
    },
  ];

  const currentReport = weeklyReports.find(
    (report) => report.week === selectedWeek
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Weekly Report</h2>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {weeklyReports.map((report) => (
            <option key={report.week} value={report.week}>
              Week of {new Date(report.week).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <h3 className="text-xl font-bold mb-2">Weekly Summary</h3>
        <p className="opacity-90">{currentReport.summary}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(currentReport.stats).map(([key, value]) => (
          <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-3">🏆 Achievements</h4>
          <ul className="space-y-2">
            {currentReport.achievements.map((achievement, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm text-green-700">{achievement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-3">
            📈 Areas to Improve
          </h4>
          <ul className="space-y-2">
            {currentReport.areasToImprove.map((area, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span className="text-sm text-yellow-700">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Teacher Comments */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          👩‍🏫 Teacher's Comments
        </h4>
        <p className="text-sm text-blue-700 italic">
          "{currentReport.teacherComments}"
        </p>
      </div>

      {/* Progress Comparison */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          📊 Progress Comparison
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+6%</div>
            <div className="text-sm text-gray-600">Score Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">+2.3h</div>
            <div className="text-sm text-gray-600">Study Time Increase</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          📧 Message Teacher
        </button>
        <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
          📥 Download PDF Report
        </button>
      </div>
    </div>
  );
};

export default WeeklyReport;
