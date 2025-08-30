import React from "react";

const Recommendations = () => {
  const recommendations = [
    {
      category: "academic",
      priority: "high",
      title: "Mathematics Reinforcement",
      description:
        "Alemu is excelling in Mathematics (92%). Consider advanced topics to maintain engagement.",
      action: "Explore advanced Mathematics materials",
      child: "Alemu Tekle",
      subject: "Mathematics",
    },
    {
      category: "academic",
      priority: "medium",
      title: "Chemistry Support Needed",
      description:
        "Chemistry scores are below class average. Focus on fundamental concepts.",
      action: "Schedule Chemistry review sessions",
      child: "Alemu Tekle",
      subject: "Chemistry",
    },
    {
      category: "behavioral",
      priority: "low",
      title: "Study Habits",
      description:
        "Consider establishing a consistent daily study routine for better time management.",
      action: "Create study schedule",
      child: "Alemu Tekle",
    },
    {
      category: "wellness",
      priority: "medium",
      title: "Break Time",
      description:
        "Ensure regular breaks during study sessions to maintain focus and prevent burnout.",
      action: "Implement 5-minute breaks every 25 minutes",
      child: "Alemu Tekle",
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high":
        return "High Priority";
      case "medium":
        return "Medium Priority";
      case "low":
        return "Low Priority";
      default:
        return "Priority";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "academic":
        return "📚";
      case "behavioral":
        return "⏰";
      case "wellness":
        return "💪";
      default:
        return "💡";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        AI Recommendations
      </h2>

      {/* Recommendation Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">4</div>
          <div className="text-sm text-blue-700">Total Recommendations</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">1</div>
          <div className="text-sm text-red-700">High Priority</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">2</div>
          <div className="text-sm text-yellow-700">Medium Priority</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">1</div>
          <div className="text-sm text-green-700">Low Priority</div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-xl mr-3">
                  {getCategoryIcon(recommendation.category)}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {recommendation.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {recommendation.child} •{" "}
                    {recommendation.subject || "General"}
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getPriorityColor(recommendation.priority) === "red"
                    ? "bg-red-100 text-red-800"
                    : getPriorityColor(recommendation.priority) === "yellow"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {getPriorityText(recommendation.priority)}
              </span>
            </div>

            <p className="text-gray-700 mb-3">{recommendation.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600">
                {recommendation.action}
              </span>

              <div className="flex space-x-2">
                <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                  Implement
                </button>
                <button className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                  Remind Later
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-2">🤖 AI Insights</h3>
        <p className="text-sm text-purple-700">
          Based on Alemu's learning patterns, we recommend focusing on Chemistry
          fundamentals while maintaining Mathematics excellence. Consistent
          study routines show 25% better retention compared to cramming.
        </p>
      </div>

      {/* Action Plan */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          📋 Suggested Action Plan
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              Schedule 30-minute Chemistry review sessions 3 times per week
            </li>
            <li>
              Introduce advanced Mathematics problems to maintain engagement
            </li>
            <li>Establish consistent study hours (4-6 PM weekdays)</li>
            <li>Monitor progress weekly and adjust as needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
