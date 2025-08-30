import React, { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChildProgress = () => {
  const [selectedChild, setSelectedChild] = useState("Alemu Tekle");

  const children = [
    {
      name: "Alemu Tekle",
      grade: "Grade 10",
      school: "Addis Ababa High School",
      overallProgress: 85,
      attendance: "96%",
      subjects: [
        { name: "Mathematics", progress: 92, trend: "up" },
        { name: "Physics", progress: 85, trend: "up" },
        { name: "Chemistry", progress: 78, trend: "stable" },
        { name: "English", progress: 88, trend: "up" },
      ],
    },
    {
      name: "Birtukan Haile",
      grade: "Grade 8",
      school: "Unity Elementary",
      overallProgress: 76,
      attendance: "92%",
      subjects: [
        { name: "Mathematics", progress: 80, trend: "up" },
        { name: "Science", progress: 72, trend: "stable" },
        { name: "English", progress: 85, trend: "up" },
        { name: "History", progress: 68, trend: "down" },
      ],
    },
  ];

  const selectedChildData = children.find(
    (child) => child.name === selectedChild
  );

  const subjectPerformanceData = {
    labels: selectedChildData.subjects.map((subject) => subject.name),
    datasets: [
      {
        label: "Progress (%)",
        data: selectedChildData.subjects.map((subject) => subject.progress),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const weeklyProgressData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Overall Progress",
        data: [65, 68, 72, 75, 78, selectedChildData.overallProgress],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
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

  const lineOptions = {
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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Child Progress</h2>
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {children.map((child) => (
            <option key={child.name} value={child.name}>
              {child.name}
            </option>
          ))}
        </select>
      </div>

      {/* Child Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {selectedChildData.overallProgress}%
          </div>
          <div className="text-sm text-blue-700">Overall Progress</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {selectedChildData.attendance}
          </div>
          <div className="text-sm text-green-700">Attendance</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {selectedChildData.grade}
          </div>
          <div className="text-sm text-purple-700">Grade Level</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">4</div>
          <div className="text-sm text-orange-700">Subjects</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="h-64">
          <Bar data={subjectPerformanceData} options={barOptions} />
        </div>
        <div className="h-64">
          <Line data={weeklyProgressData} options={lineOptions} />
        </div>
      </div>

      {/* Subject Details */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Subject Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedChildData.subjects.map((subject, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{subject.name}</h4>
                <span
                  className={`text-sm font-medium ${
                    subject.trend === "up"
                      ? "text-green-600"
                      : subject.trend === "down"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {subject.trend === "up"
                    ? "📈"
                    : subject.trend === "down"
                    ? "📉"
                    : "↔"}{" "}
                  {subject.progress}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${subject.progress}%`,
                    backgroundColor:
                      subject.progress >= 80
                        ? "#16a34a"
                        : subject.progress >= 70
                        ? "#ca8a04"
                        : "#dc2626",
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>Mastery Level</span>
                <span>
                  {subject.progress >= 80
                    ? "Advanced"
                    : subject.progress >= 70
                    ? "Proficient"
                    : "Basic"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 Suggested Actions
        </h4>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• Schedule study time for subjects below 80%</p>
          <p>• Celebrate progress in Mathematics (92%)</p>
          <p>• Discuss Chemistry performance with teacher</p>
        </div>
      </div>
    </div>
  );
};

export default ChildProgress;
