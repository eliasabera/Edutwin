import React from "react";
import ChildProgress from "../components/dashboard/ChildProgress";
import WeeklyReport from "../components/dashboard/WeeklyReport";

const Dashboard = () => {
  // Sample data for dashboard overview
  const dashboardStats = [
    { label: "Children", value: "2", icon: "👨‍👩‍👧‍👦", trend: "+0" },
    { label: "Active Alerts", value: "3", icon: "🔔", trend: "+2" },
    { label: "Avg. Progress", value: "81%", icon: "📈", trend: "+5%" },
    { label: "School Days", value: "18/20", icon: "📅", trend: "90%" },
  ];

  const recentActivities = [
    {
      type: "achievement",
      child: "Alemu Tekle",
      description: "Earned Mathematics Excellence Badge",
      time: "2 hours ago",
      icon: "🏆",
    },
    {
      type: "assignment",
      child: "Birtukan Haile",
      description: "Submitted Physics homework",
      time: "5 hours ago",
      icon: "📝",
    },
    {
      type: "alert",
      child: "Alemu Tekle",
      description: "Chemistry quiz score below average",
      time: "1 day ago",
      icon: "⚠️",
    },
    {
      type: "progress",
      child: "Birtukan Haile",
      description: "Reached 85% in English",
      time: "2 days ago",
      icon: "🎯",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600">
            Monitor your children's academic progress
          </p>
        </div>
        <div className="text-sm text-gray-600">Last updated: Today</div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
        <p className="opacity-90">
          You have 2 children actively learning. 3 new alerts require your
          attention.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xs text-green-600 mt-1">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Child Progress */}
        <ChildProgress />

        {/* Right Column */}
        <div className="space-y-6">
          {/* Weekly Report Summary */}
          <WeeklyReport />

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-xl mr-3">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.child} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
                📧 Message Teacher
              </button>
              <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors">
                📊 View Reports
              </button>
              <button className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors">
                ⚙️ Settings
              </button>
              <button className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition-colors">
                💬 Contact School
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📅 Upcoming Events
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              20
            </div>
            <div>
              <p className="font-medium text-gray-900">Mathematics Test</p>
              <p className="text-sm text-gray-600">Alemu Tekle • Jan 20</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              22
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Parent-Teacher Meeting
              </p>
              <p className="text-sm text-gray-600">School • Jan 22</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
