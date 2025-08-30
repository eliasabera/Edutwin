import React, { useState } from "react";
import LessonViewer from "../components/learning/LessonViewer";
import QuizInterface from "../components/learning/QuizInterface";
import AITutor from "../components/learning/AITutor";

const Learn = () => {
  const [activeTab, setActiveTab] = useState("lessons");

  const courses = [
    {
      id: 1,
      title: "Mathematics",
      progress: 85,
      lessons: 12,
      icon: "🧮",
    },
    {
      id: 2,
      title: "Physics",
      progress: 65,
      lessons: 8,
      icon: "⚛️",
    },
    {
      id: 3,
      title: "Chemistry",
      progress: 45,
      lessons: 6,
      icon: "🧪",
    },
    {
      id: 4,
      title: "Biology",
      progress: 72,
      lessons: 10,
      icon: "🧬",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
        <div className="text-sm text-gray-600">
          Continue your learning journey
        </div>
      </div>

      {/* Course Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-3xl mb-3">{course.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              {course.progress}% Complete • {course.lessons} Lessons
            </div>
          </div>
        ))}
      </div>

      {/* Learning Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "lessons", label: "📚 Lessons", component: LessonViewer },
              { id: "quizzes", label: "📝 Quizzes", component: QuizInterface },
              { id: "tutor", label: "🤖 AI Tutor", component: AITutor },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "lessons" && <LessonViewer />}
          {activeTab === "quizzes" && <QuizInterface />}
          {activeTab === "tutor" && <AITutor />}
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          🎯 Recommended Next
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 text-lg">➡️</span>
              <span className="ml-2 font-medium">Continue Algebra Lesson</span>
            </div>
            <p className="text-sm text-gray-600">
              You were 75% through the previous lesson
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-green-600 text-lg">⭐</span>
              <span className="ml-2 font-medium">Review Physics Quiz</span>
            </div>
            <p className="text-sm text-gray-600">
              Focus on questions you got wrong
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;
