import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProgressOverview = () => {
  // Sample progress data
  const progressData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Mathematics",
        data: [45, 52, 60, 68, 75, 85],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Physics",
        data: [30, 40, 48, 55, 60, 65],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Progress Trend",
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + "%";
          },
        },
      },
    },
  };

  const stats = [
    {
      label: "Total Learning Hours",
      value: "48h",
      change: "+12%",
      trend: "up",
    },
    { label: "Quizzes Completed", value: "24", change: "+8%", trend: "up" },
    { label: "Average Score", value: "78%", change: "+5%", trend: "up" },
    { label: "Streak", value: "12 days", change: "Current", trend: "neutral" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Progress Overview
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div
              className={`text-xs mt-1 ${
                stat.trend === "up"
                  ? "text-green-600"
                  : stat.trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="h-80">
        <Line data={progressData} options={options} />
      </div>

      {/* Quick Insights */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">📈 Positive Trend</h3>
        <p className="text-sm text-green-700">
          Your Mathematics score has improved by 40% over the last 6 weeks. Keep
          up the good work!
        </p>
      </div>
    </div>
  );
};

export default ProgressOverview;
