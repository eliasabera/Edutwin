import React, { useState } from "react";
import StudentProgress from "../components/analytics/StudentProgress";
import TopicAnalysis from "../components/analytics/TopicAnalysis";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [timeRange, setTimeRange] = useState("month");

  const analyticsStats = [
    { label: "Class Average", value: "76%", change: "+5%", positive: true },
    { label: "Completion Rate", value: "88%", change: "+3%", positive: true },
    { label: "Top Students", value: "8", change: "+2", positive: true },
    { label: "Need Help", value: "3", change: "-1", positive: true },
  ];

  const performanceTrends = [
    { subject: "Mathematics", trend: "up", change: "+8%", current: 85 },
    { subject: "Physics", trend: "up", change: "+5%", current: 72 },
    { subject: "Chemistry", trend: "down", change: "-3%", current: 68 },
    { subject: "Biology", trend: "stable", change: "0%", current: 79 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teaching Analytics
          </h1>
          <p className="text-gray-600">
            Deep insights into student performance and learning patterns
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="term">This Term</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analyticsStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div
              className={`text-xs font-medium ${
                stat.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📈 Performance Trends
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {performanceTrends.map((subject, index) => (
            <div
              key={index}
              className="text-center p-4 border border-gray-200 rounded-lg"
            >
              <div className="text-lg font-semibold text-gray-900">
                {subject.subject}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {subject.current}%
              </div>
              <div
                className={`text-sm font-medium ${
                  subject.trend === "up"
                    ? "text-green-600"
                    : subject.trend === "down"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {subject.trend === "up"
                  ? "📈"
                  : subject.trend === "down"
                  ? "📉"
                  : "↔"}{" "}
                {subject.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              {
                id: "students",
                label: "👥 Student Progress",
                component: StudentProgress,
              },
              {
                id: "topics",
                label: "📚 Topic Analysis",
                component: TopicAnalysis,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "students" && <StudentProgress />}
          {activeTab === "topics" && <TopicAnalysis />}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 Teaching Insights
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>
              • Chemistry scores dropped by 3% - review fundamental concepts
            </li>
            <li>• Mathematics shows strongest improvement (+8%)</li>
            <li>
              • 3 students consistently scoring below 60% need intervention
            </li>
            <li>• Morning sessions show 15% better retention than afternoon</li>
            <li>• Group activities improve participation by 25%</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-2xl p-6">
          <h3 className="font-semibold text-green-900 mb-3">
            🎯 Action Recommendations
          </h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li>• Schedule Chemistry review session this week</li>
            <li>• Create differentiated assignments for struggling students</li>
            <li>• Use more visual aids in Physics lessons</li>
            <li>• Implement peer tutoring for Mathematics</li>
            <li>• Schedule parent meetings for bottom 5 students</li>
          </ul>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Export Reports
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700">
            📄 PDF Report
          </button>
          <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
            📊 Excel Data
          </button>
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
            📈 Charts
          </button>
          <button className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700">
            👥 Share with Staff
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
