import React from "react";
import KnowledgeMeter from "../components/dashboard/KnowledgeMeter";
import ProgressOverview from "../components/dashboard/ProgressOverview";
import RecentActivity from "../components/dashboard/RecentActivity";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <div className="text-sm text-gray-600">Last updated: Today</div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Student! 👋</h2>
        <p className="opacity-90">
          You've completed 12 lessons this week. Keep up the great work!
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <KnowledgeMeter />
          <RecentActivity />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProgressOverview />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Quizzes Taken</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
              <div className="text-2xl font-bold text-orange-600">7</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📅 Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium">Math Assignment</div>
                  <div className="text-sm text-gray-600">Due Tomorrow</div>
                </div>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Start
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Physics Quiz</div>
                  <div className="text-sm text-gray-600">Due in 2 days</div>
                </div>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
