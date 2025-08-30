import React from "react";
import ClassOverview from "../components/dashboard/ClassOverview";
import PerformanceMetrics from "../components/dashboard/PerformanceMetrics";

const Dashboard = () => {
  // Sample data for dashboard
  const quickStats = [
    { label: "Total Students", value: "45", icon: "👨‍🎓", trend: "+3 this term" },
    {
      label: "Average Score",
      value: "76%",
      icon: "📊",
      trend: "+5% from last week",
    },
    { label: "Assignments", value: "12", icon: "📝", trend: "2 due tomorrow" },
    { label: "Attendance", value: "92%", icon: "✅", trend: "This week" },
  ];

  const recentActivities = [
    {
      type: "assignment",
      title: "Algebra Homework #5 graded",
      description: "32/45 submissions, average score 82%",
      time: "2 hours ago",
      icon: "📝",
    },
    {
      type: "quiz",
      title: "Physics Quiz completed",
      description: "Class average: 75%, top score: 95%",
      time: "5 hours ago",
      icon: "📊",
    },
    {
      type: "message",
      title: "Parent message received",
      description: "From Mr. Tekle regarding Algebra progress",
      time: "1 day ago",
      icon: "💬",
    },
    {
      type: "alert",
      title: "3 students need attention",
      description: "Low scores in Chemistry quiz",
      time: "2 days ago",
      icon: "⚠️",
    },
  ];

  const upcomingTasks = [
    {
      title: "Grade Physics lab reports",
      due: "Today",
      priority: "high",
      subject: "Physics",
    },
    {
      title: "Prepare Chemistry lesson",
      due: "Tomorrow",
      priority: "medium",
      subject: "Chemistry",
    },
    {
      title: "Parent-teacher meetings",
      due: "Jan 22",
      priority: "medium",
      subject: "General",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, Mr. Getachew! Here's your class overview.
          </p>
        </div>
        <div className="text-sm text-gray-600">Last updated: Today</div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Teaching Analytics 📈</h2>
        <p className="opacity-90">
          Your class average improved by 5% this week. 3 students need extra
          attention in Chemistry.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
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
        {/* Left Column */}
        <ClassOverview />

        {/* Right Column */}
        <div className="space-y-6">
          <PerformanceMetrics />

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activities
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
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Upcoming Tasks
            </h3>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.subject}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Due: {task.due}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
            📝 Create Assignment
          </button>
          <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors">
            📊 Grade Work
          </button>
          <button className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors">
            👥 Take Attendance
          </button>
          <button className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition-colors">
            💬 Message Parents
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
