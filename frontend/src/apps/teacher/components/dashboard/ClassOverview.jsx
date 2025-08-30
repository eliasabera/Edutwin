import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ClassOverview = () => {
  // Sample data
  const classPerformanceData = {
    labels: ["Mathematics", "Physics", "Chemistry", "Biology"],
    datasets: [
      {
        label: "Average Score (%)",
        data: [85, 72, 68, 79],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(139, 92, 246)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const studentDistributionData = {
    labels: [
      "A (90-100%)",
      "B (80-89%)",
      "C (70-79%)",
      "D (60-69%)",
      "F (<60%)",
    ],
    datasets: [
      {
        data: [8, 12, 15, 7, 3],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(101, 163, 13, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(220, 38, 38, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Class Performance by Subject",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Grade Distribution",
      },
    },
  };

  const stats = [
    { label: "Total Students", value: "45", icon: "👨‍🎓", trend: "+3" },
    { label: "Average Score", value: "76%", icon: "📊", trend: "+5%" },
    { label: "Assignments", value: "12", icon: "📝", trend: "2 due" },
    { label: "Attendance", value: "92%", icon: "✅", trend: "This week" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Class Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xs text-green-600 mt-1">{stat.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64">
          <Bar data={classPerformanceData} options={barOptions} />
        </div>

        <div className="h-64">
          <Doughnut data={studentDistributionData} options={doughnutOptions} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
          📋 Take Attendance
        </button>
        <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors">
          📝 Create Assignment
        </button>
      </div>
    </div>
  );
};

export default ClassOverview;
