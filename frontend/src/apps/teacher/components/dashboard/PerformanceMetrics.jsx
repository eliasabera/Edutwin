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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PerformanceMetrics = () => {
  const weeklyTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Class Average",
        data: [65, 68, 72, 75, 78, 76],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Top Students",
        data: [85, 88, 90, 92, 94, 95],
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
        text: "Weekly Performance Trend",
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

  const metrics = [
    { label: "Completion Rate", value: "88%", trend: "+5%", positive: true },
    {
      label: "Assignment Submissions",
      value: "92%",
      trend: "+3%",
      positive: true,
    },
    {
      label: "Participation Rate",
      value: "75%",
      trend: "-2%",
      positive: false,
    },
    {
      label: "Average Time Spent",
      value: "3.2h",
      trend: "+0.5h",
      positive: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Performance Metrics
      </h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
            <div
              className={`text-xs font-medium ${
                metric.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {metric.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="h-64 mb-6">
        <Line data={weeklyTrendData} options={options} />
      </div>

      {/* Insights */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📈 Key Insights</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Class average improved by 11% over 6 weeks</li>
          <li>• 92% assignment submission rate this week</li>
          <li>• Top students consistently scoring above 90%</li>
          <li>• Participation rate needs improvement (-2% this week)</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
