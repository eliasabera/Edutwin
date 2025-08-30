import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "./Button";

const NotFound = ({
  title = "Page Not Found",
  message = "Sorry, the page you are looking for doesn't exist or has been moved.",
  showAction = true,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 graphic */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-blue-600 opacity-10">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-blue-600">404</div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-8 text-lg">{message}</p>

        {showAction && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="large"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>

              <Link to={user ? `/${user.role}/dashboard` : "/"}>
                <Button variant="outline" size="large">
                  {user ? "Go to Dashboard" : "Go Home"}
                </Button>
              </Link>
            </div>

            {/* Additional help options */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-3">Need help?</p>
              <div className="flex justify-center space-x-6">
                <Link
                  to="/contact"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Contact Support
                </Link>
                <a
                  href="/help"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Help Center
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="mt-12 opacity-30">
          <svg
            className="w-24 h-24 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.867-6.1 2.291"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Specific not found variants
export const PageNotFound = () => <NotFound />;

export const ResourceNotFound = ({ resourceName = "resource" }) => (
  <NotFound
    title={`${
      resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
    } Not Found`}
    message={`The ${resourceName} you're looking for doesn't exist or has been removed.`}
  />
);

export const AccessDenied = () => (
  <NotFound
    title="Access Denied"
    message="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
    showAction={false}
  />
);

export default NotFound;
