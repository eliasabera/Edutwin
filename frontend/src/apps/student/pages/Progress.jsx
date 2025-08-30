import React, { useState } from "react";
import ProgressCharts from "../components/progress/ProgressCharts";
import MasteryLevels from "../components/progress/MasteryLevels";
import Badges from "../components/progress/Badges";

const Progress = () => {
  const [timeRange, setTimeRange] = useState("week");

  const statistics = [
    { label: "Total Learning Hours", value: "48h", change: "+12%" },
    { label: "Lessons Completed", value: "24", change: "+8%" },
    { label: "Average Score", value: "78%", change: "+5%" },
    { label: "Quizzes Taken", value: "15", change: "+20%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Progress Tracking
          </h1>
          <p className="text-gray-600">
            Monitor your learning journey and achievements
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div className="text-xs text-green-600 font-medium">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Charts */}
      <ProgressCharts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MasteryLevels />
        <Badges />
      </div>

      {/* Weekly Report */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Weekly Performance Report
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">📈 Strengths</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Algebra concepts mastered
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Consistent study schedule
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Quick quiz completion
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              📉 Areas to Improve
            </h4>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Physics problem-solving
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Chemistry terminology
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Time management in quizzes
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 Recommendations
          </h4>
          <p className="text-sm text-blue-700">
            Focus on physics practice problems and chemistry flashcards this
            week. You're making excellent progress in mathematics - consider
            taking on more advanced topics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Progress;
