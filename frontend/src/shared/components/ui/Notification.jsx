import React from "react";

const Notification = ({ type, message, onClose }) => {
  const getStyles = () => {
    const baseStyles =
      "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-2xl shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out";

    switch (type) {
      case "success":
        return `${baseStyles} border-green-500`;
      case "error":
        return `${baseStyles} border-red-500`;
      case "warning":
        return `${baseStyles} border-yellow-500`;
      case "info":
        return `${baseStyles} border-blue-500`;
      default:
        return `${baseStyles} border-gray-500`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "💡";
    }
  };

  return (
    <div className={getStyles()}>
      <div className="flex items-start">
        <span className="text-xl mr-3">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
