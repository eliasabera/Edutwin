import React, { createContext, useState, useCallback } from "react";
import Notification from "../components/ui/Notification";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const showNotification = useCallback(
    (type, message, duration = 5000) => {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }

      setNotification({ type, message });

      // Auto-dismiss after duration
      const newTimeoutId = setTimeout(() => {
        setNotification(null);
      }, duration);

      setTimeoutId(newTimeoutId);
    },
    [timeoutId]
  );

  const hideNotification = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setNotification(null);
  }, [timeoutId]);

  const value = {
    showNotification,
    hideNotification,
    notification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export { NotificationContext };
