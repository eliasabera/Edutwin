import React from "react";

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: "quiz",
      subject: "Mathematics",
      title: "Algebra Basics Quiz",
      score: 85,
      status: "completed",
      time: "2 hours ago",
      icon: "📝",
    },
    {
      id: 2,
      type: "lesson",
      subject: "Physics",
      title: "Newton's Laws of Motion",
      status: "completed",
      time: "5 hours ago",
      icon: "📚",
    },
    {
      id: 3,
      type: "assignment",
      subject: "Chemistry",
      title: "Periodic Table Assignment",
      status: "pending",
      due: "Tomorrow",
      time: "8 hours ago",
      icon: "📋",
    },
    {
      id: 4,
      type: "badge",
      subject: "Mathematics",
      title: "Algebra Master Badge",
      status: "earned",
      time: "1 day ago",
      icon: "🏆",
    },
    {
      id: 5,
      type: "challenge",
      subject: "Physics",
      title: "Weekly Challenge",
      status: "available",
      time: "2 days ago",
      icon: "⚡",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "earned":
        return "text-purple-600 bg-purple-100";
      case "available":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getActionText = (activity) => {
    switch (activity.type) {
      case "quiz":
        return `Scored ${activity.score}%`;
      case "lesson":
        return "Completed";
      case "assignment":
        return `Due ${activity.due}`;
      case "badge":
        return "Earned";
      case "challenge":
        return "Available";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All →
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mr-4">{activity.icon}</div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {activity.title}
                </h3>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">
                  {activity.subject}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                    activity.status
                  )}`}
                >
                  {getActionText(activity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">
          🚀 What to do next?
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left p-2 hover:bg-blue-100 rounded">
            ➕ Continue with Chemistry assignment
          </button>
          <button className="w-full text-left p-2 hover:bg-blue-100 rounded">
            🎯 Try Physics weekly challenge
          </button>
          <button className="w-full text-left p-2 hover:bg-blue-100 rounded">
            📊 Review Mathematics quiz results
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
