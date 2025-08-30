import { useState, useEffect } from "react";
import { api } from "../../../shared/services/api";

export const useStudentProgress = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await api.get("/students/progress");
      setProgressData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch progress data");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates) => {
    try {
      const response = await api.put("/students/progress", updates);
      setProgressData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update progress");
      throw err;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return {
    progressData,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress,
  };
};
