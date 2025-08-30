import React from "react";

const LoadingSpinner = ({
  size = "large",
  className = "",
  text = "Loading...",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const textSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        ></div>
        {/* Optional: Add a centered icon inside the spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-blue-600 rounded-full opacity-20"></div>
        </div>
      </div>
      {text && (
        <p className={`mt-3 text-gray-600 font-medium ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Full page loading spinner variant
export const FullPageSpinner = () => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <LoadingSpinner size="large" text="Loading EduTwin..." />
  </div>
);

// Content loading spinner variant
export const ContentSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="medium" text="Loading content..." />
  </div>
);

// Button loading spinner variant
export const ButtonSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  </div>
);

export default LoadingSpinner;
