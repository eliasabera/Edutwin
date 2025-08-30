import React, { useState } from "react";
import AlertSystem from "../components/monitoring/AlertSystem";
import Recommendations from "../components/monitoring/Recommendations";

const Monitoring = () => {
  const [activeTab, setActiveTab] = useState("alerts");

  const monitoringStats = [
    { label: "Total Alerts", value: "12", icon: "🔔", trend: "This month" },
    { label: "Resolved", value: "8", icon: "✅", trend: "67% resolved" },
    {
      label: "High Priority",
      value: "3",
      icon: "⚠️",
      trend: "Needs attention",
    },
    {
      label: "Avg. Response",
      value: "2.4h",
      icon: "⏱️",
      trend: "Response time",
    },
  ];

  const children = [
    {
      name: "Alemu Tekle",
      grade: "Grade 10",
      status: "online",
      progress: 85,
      alerts: 2,
      subjects: ["Mathematics", "Physics", "Chemistry"],
    },
    {
      name: "Birtukan Haile",
      grade: "Grade 8",
      status: "offline",
      progress: 76,
      alerts: 1,
      subjects: ["Mathematics", "Science", "English"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Monitoring Center
          </h1>
          <p className="text-gray-600">
            Track alerts, recommendations, and child activities
          </p>
        </div>
        <div className="text-sm text-gray-600">Real-time monitoring</div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {monitoringStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xs text-blue-600 mt-1">{stat.trend}</div>
          </div>
        ))}
      </div>

      {/* Children Status */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          👨‍👩‍👧‍👦 Children Status
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      child.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <h3 className="font-semibold text-gray-900">{child.name}</h3>
                </div>
                <span className="text-sm text-gray-600">{child.grade}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{child.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${child.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div className="text-sm">
                  <span className="text-gray-600">Alerts: </span>
                  <span
                    className={
                      child.alerts > 0
                        ? "text-red-600 font-medium"
                        : "text-green-600"
                    }
                  >
                    {child.alerts}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Status: </span>
                  <span
                    className={
                      child.status === "online"
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {child.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {child.subjects.map((subject, subIndex) => (
                  <span
                    key={subIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">
                View Detailed Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              {
                id: "alerts",
                label: "🚨 Alert System",
                component: AlertSystem,
              },
              {
                id: "recommendations",
                label: "💡 Recommendations",
                component: Recommendations,
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
          {activeTab === "alerts" && <AlertSystem />}
          {activeTab === "recommendations" && <Recommendations />}
        </div>
      </div>

      {/* Quick Support */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📞 Quick Support</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>School Office:</strong> +251 11 123 4567
            </p>
            <p>
              <strong>Mathematics Teacher:</strong> Mr. Getachew
            </p>
            <p>
              <strong>Chemistry Teacher:</strong> Mrs. Selam
            </p>
            <p>
              <strong>Emergency:</strong> Available 24/7
            </p>
          </div>
          <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Contact Support
          </button>
        </div>

        <div className="bg-green-50 rounded-2xl p-6">
          <h3 className="font-semibold text-green-900 mb-3">
            📋 Monitoring Tips
          </h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li>• Check alerts daily for important updates</li>
            <li>• Review weekly reports every Sunday</li>
            <li>• Set up custom alert preferences</li>
            <li>• Contact teachers for specific concerns</li>
            <li>• Use AI recommendations for guidance</li>
          </ul>
          <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
            View Guide
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-4">🖥️ System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">Live Monitoring</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">Alert System</div>
            <div className="text-xs text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">Data Sync</div>
            <div className="text-xs text-gray-600">Updated 2m ago</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">AI Analysis</div>
            <div className="text-xs text-gray-600">Running</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
