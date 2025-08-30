import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const studentMenu = [
    { path: "/student/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/student/learn", label: "Learn", icon: "📚" },
    { path: "/student/progress", label: "Progress", icon: "📈" },
  ];

  const teacherMenu = [
    { path: "/teacher/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/teacher/analytics", label: "Analytics", icon: "📈" },
    { path: "/teacher/management", label: "Management", icon: "⚙️" },
  ];

  const parentMenu = [
    { path: "/parent/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/parent/monitoring", label: "Monitoring", icon: "👀" },
  ];

  const getMenu = () => {
    switch (user.role) {
      case "student":
        return studentMenu;
      case "teacher":
        return teacherMenu;
      case "parent":
        return parentMenu;
      default:
        return [];
    }
  };

  const menuItems = getMenu();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 shadow-sm">
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
