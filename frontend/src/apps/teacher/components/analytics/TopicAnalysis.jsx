import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TopicAnalysis = () => {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");

  const subjects = {
    Mathematics: {
      topics: [
        { name: "Algebra", mastery: 85, questions: 45, avgScore: 82 },
        { name: "Geometry", mastery: 72, questions: 32, avgScore: 75 },
        { name: "Calculus", mastery: 58, questions: 28, avgScore: 65 },
        { name: "Statistics", mastery: 91, questions: 38, avgScore: 88 },
      ],
    },
    Physics: {
      topics: [
        { name: "Mechanics", mastery: 78, questions: 42, avgScore: 80 },
        { name: "Electricity", mastery: 65, questions: 35, avgScore: 68 },
        { name: "Optics", mastery: 82, questions: 28, avgScore: 85 },
        { name: "Thermodynamics", mastery: 55, questions: 25, avgScore: 60 },
      ],
    },
  };

  const chartData = {
    labels: subjects[selectedSubject].topics.map((topic) => topic.name),
    datasets: [
      {
        label: "Mastery Level (%)",
        data: subjects[selectedSubject].topics.map((topic) => topic.mastery),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "Average Score (%)",
        data: subjects[selectedSubject].topics.map((topic) => topic.avgScore),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Topic Mastery vs Average Scores",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Topic Analysis</h2>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Topic Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Topic Breakdown</h3>
        {subjects[selectedSubject].topics.map((topic, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{topic.name}</h4>
              <span
                className={`font-bold ${
                  topic.mastery >= 80
                    ? "text-green-600"
                    : topic.mastery >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {topic.mastery}% Mastery
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{topic.questions} questions</span>
              <span>Avg Score: {topic.avgScore}%</span>
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{topic.mastery}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${topic.mastery}%`,
                    backgroundColor:
                      topic.mastery >= 80
                        ? "#16a34a"
                        : topic.mastery >= 60
                        ? "#ca8a04"
                        : "#dc2626",
                  }}
                ></div>
              </div>
            </div>

            {topic.mastery < 70 && (
              <div className="mt-2 p-2 bg-red-50 rounded">
                <p className="text-xs text-red-700">
                  ⚠️ Students struggling with this topic. Consider review
                  session.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicAnalysis;
