import React from "react";

const Badges = () => {
  const earnedBadges = [
    {
      id: 1,
      name: "Algebra Master",
      description: "Completed all algebra challenges with 90%+ score",
      icon: "🏆",
      earnedDate: "2024-01-15",
      rarity: "rare",
    },
    {
      id: 2,
      name: "Quick Learner",
      description: "Completed 5 lessons in one day",
      icon: "⚡",
      earnedDate: "2024-01-10",
      rarity: "common",
    },
    {
      id: 3,
      name: "Quiz Champion",
      description: "Scored 100% on 3 consecutive quizzes",
      icon: "🎯",
      earnedDate: "2024-01-08",
      rarity: "uncommon",
    },
  ];

  const upcomingBadges = [
    {
      id: 4,
      name: "Math Genius",
      description: "Reach expert level in Mathematics",
      icon: "🧠",
      progress: 85,
      required: 100,
      rarity: "epic",
    },
    {
      id: 5,
      name: "Study Streak",
      description: "Study for 7 consecutive days",
      icon: "🔥",
      progress: 4,
      required: 7,
      rarity: "rare",
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "border-gray-300 bg-gray-50";
      case "uncommon":
        return "border-green-300 bg-green-50";
      case "rare":
        return "border-blue-300 bg-blue-50";
      case "epic":
        return "border-purple-300 bg-purple-50";
      case "legendary":
        return "border-yellow-300 bg-yellow-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Achievements & Badges
      </h2>

      {/* Earned Badges */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Earned Badges ({earnedBadges.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className={`border-2 rounded-2xl p-4 text-center ${getRarityColor(
                badge.rarity
              )}`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-1">{badge.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
              <span className="text-xs text-gray-500">
                Earned: {new Date(badge.earnedDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Badges */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Badges
        </h3>
        <div className="space-y-4">
          {upcomingBadges.map((badge) => (
            <div
              key={badge.id}
              className="border border-gray-200 rounded-2xl p-4"
            >
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{badge.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {badge.progress}/{badge.required}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(badge.progress / badge.required) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="text-right text-xs text-gray-500 mt-1">
                {Math.round((badge.progress / badge.required) * 100)}% complete
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Stats */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">
          Badge Collection Progress
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-yellow-700">3 of 12 badges earned</span>
          <span className="text-sm text-yellow-600">25% complete</span>
        </div>
      </div>
    </div>
  );
};

export default Badges;
