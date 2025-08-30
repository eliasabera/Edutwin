import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
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

const ProgressCharts = () => {
  const subjectPerformanceData = {
    labels: ["Mathematics", "Physics", "Chemistry", "Biology", "English"],
    datasets: [
      {
        label: "Average Score (%)",
        data: [85, 65, 45, 72, 90],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const timeDistributionData = {
    labels: ["Mathematics", "Physics", "Chemistry", "Biology", "English"],
    datasets: [
      {
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
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
        text: "Subject Performance",
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
        text: "Time Distribution",
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Progress Analytics
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64">
          <Bar data={subjectPerformanceData} options={barOptions} />
        </div>

        <div className="h-64">
          <Doughnut data={timeDistributionData} options={doughnutOptions} />
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 font-bold text-lg">85%</div>
          <div className="text-sm text-blue-700">Math Mastery</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 font-bold text-lg">+15%</div>
          <div className="text-sm text-green-700">Weekly Improvement</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 font-bold text-lg">12h</div>
          <div className="text-sm text-purple-700">Study Time This Week</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
