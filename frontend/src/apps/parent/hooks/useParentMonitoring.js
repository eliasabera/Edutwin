import { useState, useEffect } from "react";
import { api } from "../../../shared/services/api";

export const useParentMonitoring = () => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/parents/monitoring");
      setMonitoringData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch monitoring data"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAlertSettings = async (settings) => {
    try {
      const response = await api.put("/parents/alert-settings", settings);
      setMonitoringData({
        ...monitoringData,
        alertSettings: response.data,
      });
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update alert settings"
      );
      throw err;
    }
  };

  const markAlertAsRead = async (alertId) => {
    try {
      const response = await api.patch(`/parents/alerts/${alertId}/read`);
      setMonitoringData({
        ...monitoringData,
        alerts: monitoringData.alerts.map((alert) =>
          alert.id === alertId ? response.data : alert
        ),
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark alert as read");
      throw err;
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  return {
    monitoringData,
    loading,
    error,
    refetch: fetchMonitoringData,
    updateAlertSettings,
    markAlertAsRead,
  };
};
