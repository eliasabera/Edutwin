import React, { useState } from "react";

const AlertSystem = () => {
  const [alertSettings, setAlertSettings] = useState({
    lowGrades: true,
    missingAssignments: true,
    attendanceIssues: true,
    weeklyReports: true,
    teacherMessages: true,
    lowThreshold: 70,
    immediateNotifications: true,
  });

  const recentAlerts = [
    {
      id: 1,
      type: "grade",
      severity: "warning",
      title: "Chemistry Quiz Score Below Average",
      message:
        "Alemu scored 65% on the latest Chemistry quiz (class average: 75%)",
      time: "2 hours ago",
      child: "Alemu Tekle",
      subject: "Chemistry",
      read: false,
    },
    {
      id: 2,
      type: "attendance",
      severity: "info",
      title: "Perfect Attendance Week",
      message: "Alemu maintained 100% attendance this week",
      time: "1 day ago",
      child: "Alemu Tekle",
      read: true,
    },
    {
      id: 3,
      type: "assignment",
      severity: "critical",
      title: "Missing Physics Assignment",
      message: "Physics homework #3 was not submitted on time",
      time: "3 days ago",
      child: "Alemu Tekle",
      subject: "Physics",
      read: false,
    },
    {
      id: 4,
      type: "achievement",
      severity: "success",
      title: "Mathematics Excellence Badge",
      message:
        "Alemu earned the Mathematics Mastery badge for scoring above 90%",
      time: "4 days ago",
      child: "Alemu Tekle",
      subject: "Mathematics",
      read: true,
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "red";
      case "warning":
        return "yellow";
      case "info":
        return "blue";
      case "success":
        return "green";
      default:
        return "gray";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟡";
      case "info":
        return "🔵";
      case "success":
        return "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Alert System</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alert Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">
            ⚙️ Alert Preferences
          </h3>

          <div className="space-y-4">
            {[
              { key: "lowGrades", label: "Low Grades Alert" },
              { key: "missingAssignments", label: "Missing Assignments" },
              { key: "attendanceIssues", label: "Attendance Issues" },
              { key: "weeklyReports", label: "Weekly Reports" },
              { key: "teacherMessages", label: "Teacher Messages" },
              {
                key: "immediateNotifications",
                label: "Immediate Notifications",
              },
            ].map((setting) => (
              <label key={setting.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={alertSettings[setting.key]}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      [setting.key]: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {setting.label}
                </span>
              </label>
            ))}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Grade Threshold: {alertSettings.lowThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="90"
                value={alertSettings.lowThreshold}
                onChange={(e) =>
                  setAlertSettings({
                    ...alertSettings,
                    lowThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-4">
              Save Preferences
            </button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">📋 Recent Alerts</h3>

          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg ${
                  alert.read ? "bg-gray-50" : "bg-white"
                } ${
                  getSeverityColor(alert.severity) === "red"
                    ? "border-red-500"
                    : getSeverityColor(alert.severity) === "yellow"
                    ? "border-yellow-500"
                    : getSeverityColor(alert.severity) === "blue"
                    ? "border-blue-500"
                    : getSeverityColor(alert.severity) === "green"
                    ? "border-green-500"
                    : "border-gray-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">
                        {getSeverityIcon(alert.severity)}
                      </span>
                      <h4 className="font-medium text-gray-900">
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{alert.time}</span>
                      {alert.child && <span className="mx-2">•</span>}
                      {alert.child && <span>{alert.child}</span>}
                      {alert.subject && <span className="mx-2">•</span>}
                      {alert.subject && <span>{alert.subject}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-3">
                  <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                    View Details
                  </button>
                  <button className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                    {alert.read ? "Mark Unread" : "Mark Read"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 mt-4">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;
