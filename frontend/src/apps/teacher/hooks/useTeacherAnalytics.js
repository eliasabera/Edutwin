import { useState, useEffect } from "react";
import { api } from "../../../shared/services/api";

export const useTeacherAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teachers/analytics");
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = async (updates) => {
    try {
      const response = await api.put("/teachers/analytics", updates);
      setAnalytics(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update analytics");
      throw err;
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
    updateAnalytics,
  };
};
