import React, { useState } from "react";
import AssignmentManager from "../components/management/AssignmentManager";
import ResourceCreator from "../components/management/ResourceCreator";

const Management = () => {
  const [activeTab, setActiveTab] = useState("assignments");

  const managementStats = [
    {
      label: "Active Assignments",
      value: "5",
      icon: "📝",
      trend: "2 due soon",
    },
    {
      label: "Resources Created",
      value: "24",
      icon: "📚",
      trend: "+3 this week",
    },
    {
      label: "Grading Progress",
      value: "78%",
      icon: "✏️",
      trend: "22 pending",
    },
    {
      label: "Student Submissions",
      value: "92%",
      icon: "📤",
      trend: "8 missing",
    },
  ];

  const recentActions = [
    {
      action: "Created",
      item: "Algebra Quiz #3",
      time: "2 hours ago",
      icon: "➕",
    },
    {
      action: "Graded",
      item: "Physics Homework",
      time: "5 hours ago",
      icon: "✏️",
    },
    {
      action: "Published",
      item: "Chemistry Study Guide",
      time: "1 day ago",
      icon: "📚",
    },
    {
      action: "Scheduled",
      item: "Parent Meetings",
      time: "2 days ago",
      icon: "📅",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">
            Manage assignments, resources, and classroom activities
          </p>
        </div>
        <div className="text-sm text-gray-600">Last updated: Today</div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {managementStats.map((stat, index) => (
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

      {/* Management Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              {
                id: "assignments",
                label: "📝 Assignments",
                component: AssignmentManager,
              },
              {
                id: "resources",
                label: "📚 Resources",
                component: ResourceCreator,
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
          {activeTab === "assignments" && <AssignmentManager />}
          {activeTab === "resources" && <ResourceCreator />}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🕒 Recent Actions
          </h3>
          <div className="space-y-3">
            {recentActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-xl mr-3">{action.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {action.action} {action.item}
                  </p>
                  <p className="text-xs text-gray-600">{action.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ Quick Tools
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 text-sm">
              📋 Grade Assignments
            </button>
            <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 text-sm">
              👥 Manage Students
            </button>
            <button className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 text-sm">
              📅 Schedule Events
            </button>
            <button className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 text-sm">
              💬 Send Announcements
            </button>
            <button className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 text-sm">
              ⚙️ Class Settings
            </button>
            <button className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 text-sm">
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Class Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Class Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-blue-700">Total Students</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">38</div>
            <div className="text-sm text-green-700">Active Today</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">7</div>
            <div className="text-sm text-yellow-700">Need Help</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">12</div>
            <div className="text-sm text-purple-700">Exceptional</div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏰ Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {[
            {
              subject: "Physics",
              task: "Lab Report Grading",
              due: "Today",
              priority: "high",
            },
            {
              subject: "Mathematics",
              task: "Quiz Creation",
              due: "Tomorrow",
              priority: "medium",
            },
            {
              subject: "Chemistry",
              task: "Parent Meetings",
              due: "Jan 22",
              priority: "medium",
            },
            {
              subject: "Biology",
              task: "Project Assessment",
              due: "Jan 25",
              priority: "low",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{item.task}</p>
                <p className="text-sm text-gray-600">{item.subject}</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : item.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  Due: {item.due}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Management;
