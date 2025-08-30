import React, { useState } from "react";

const QuizInterface = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Sample quiz data
  const quizData = {
    title: "Algebra Basics Quiz",
    subject: "Mathematics",
    questions: [
      {
        question: "What is the value of x in 2x + 5 = 15?",
        options: ["5", "10", "7.5", "20"],
        correctAnswer: 0,
        explanation:
          "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      },
      {
        question: "Simplify: 3(x + 4) - 2x",
        options: ["x + 12", "5x + 12", "x + 4", "3x + 10"],
        correctAnswer: 0,
        explanation: "Distribute: 3x + 12 - 2x = x + 12",
      },
    ],
  };

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === quizData.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Quiz Complete! 🎉
        </h2>
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {score} / {quizData.questions.length}
        </div>
        <p className="text-gray-600 mb-6">
          {score >= quizData.questions.length * 0.8
            ? "Excellent work!"
            : "Good effort!"}
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Review Results
        </button>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{quizData.title}</h2>
          <p className="text-gray-600">{quizData.subject}</p>
        </div>
        <div className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {quizData.questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${
              ((currentQuestion + 1) / quizData.questions.length) * 100
            }%`,
          }}
        ></div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedAnswer === index
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={handleNext}
        disabled={selectedAnswer === null}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {currentQuestion === quizData.questions.length - 1
          ? "Finish Quiz"
          : "Next Question"}
      </button>

      {/* Quiz Tools */}
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <button className="hover:text-blue-600">⏱️ 10:00</button>
        <button className="hover:text-blue-600">🔍 Review Later</button>
        <button className="hover:text-blue-600">💬 Ask Help</button>
      </div>
    </div>
  );
};

export default QuizInterface;
