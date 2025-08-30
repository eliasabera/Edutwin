import { useState, useEffect } from "react";
import { api } from "../../../shared/services/api";

export const useLearning = () => {
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLearningMaterials = async () => {
    try {
      setLoading(true);
      const [lessonsResponse, quizzesResponse] = await Promise.all([
        api.get("/students/lessons"),
        api.get("/students/quizzes"),
      ]);

      setLessons(lessonsResponse.data);
      setQuizzes(quizzesResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch learning materials"
      );
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async (lessonId) => {
    try {
      const response = await api.post(`/students/lessons/${lessonId}/start`);
      setCurrentLesson(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start lesson");
      throw err;
    }
  };

  const completeLesson = async (lessonId, results) => {
    try {
      const response = await api.post(
        `/students/lessons/${lessonId}/complete`,
        results
      );
      setCurrentLesson(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete lesson");
      throw err;
    }
  };

  const submitQuiz = async (quizId, answers) => {
    try {
      const response = await api.post(`/students/quizzes/${quizId}/submit`, {
        answers,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit quiz");
      throw err;
    }
  };

  useEffect(() => {
    fetchLearningMaterials();
  }, []);

  return {
    lessons,
    quizzes,
    currentLesson,
    loading,
    error,
    startLesson,
    completeLesson,
    submitQuiz,
    refetch: fetchLearningMaterials,
  };
};
