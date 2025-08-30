import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./shared/context/AuthContext";
import Layout from "./shared/components/layout/Layout";

// Landing pages
import HomePage from "./apps/landing/pages/HomePage";
import AboutPage from "./apps/landing/pages/AboutPage";
import ContactPage from "./apps/landing/pages/ContactPage";
import PricingPage from "./apps/landing/pages/PricingPage";

// Auth pages
import LoginForm from "./shared/components/auth/LoginForm";
import RegisterForm from "./shared/components/auth/RegiseterForm";


// Protected apps
import StudentDashboard from "./apps/student/pages/Dashboard";
import StudentLearn from "./apps/student/pages/Learn";
import StudentProgress from "./apps/student/pages/Progress";

import TeacherDashboard from "./apps/teacher/pages/Dashboard";
import TeacherAnalytics from "./apps/teacher/pages/Analytics";
import TeacherManagement from "./apps/teacher/pages/Management";

import ParentDashboard from "./apps/parent/pages/Dashboard";
import ParentMonitoring from "./apps/parent/pages/Monitoring";

// Shared components
import LoadingSpinner from "./shared/components/ui/LoadingSpinner";
import NotFound from "./shared/components/ui/NotFound";
import ProfileSettings from "./apps/shared/pages/ProfileSettings";
import { NotificationProvider } from "./shared/context/NotificationContext";
import ProfileCompletion from "./shared/pages/ProfileCompletion"

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to={`/${user.role}/dashboard`} />;

  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/learn"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLearn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentProgress />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/management"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherManagement />
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute requiredRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/monitoring"
        element={
          <ProtectedRoute requiredRole="parent">
            <ParentMonitoring />
          </ProtectedRoute>
        }
      />

      {/* Redirect authenticated users to their dashboard */}
      <Route path="/dashboard" element={<Navigate to="/student/dashboard" />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-completion"
        element={
          <ProtectedRoute>
            <ProfileCompletion />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        {" "}
        {/* ← Add this here */}
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </NotificationProvider>{" "}
      {/* ← And close it here */}
    </AuthProvider>
  );
}

export default App;
