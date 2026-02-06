import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const isActive = (path: string) => location.pathname === path;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <aside
      className={`${sidebarCollapsed ? "w-20" : "w-72"} flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? "p-3" : "p-6"}`}
    >
      <div className="flex flex-col gap-8">
        {/* Logo/Brand and Toggle */}
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="bg-blue-600 rounded-lg size-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-gray-900 text-base font-bold leading-tight">
                  TaskTracker
                </h1>
                <p className="text-gray-600 text-xs font-normal">
                  Pro Team Edition
                </p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-lg">
              {sidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/projects")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/projects"
            title="Projects"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/projects")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              folder_open
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/projects") ? "font-semibold" : "font-medium"}`}
              >
                Projects
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/dashboard")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/dashboard"
            title="Tasks"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/dashboard")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              check_box
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/dashboard") ? "font-semibold" : "font-medium"}`}
              >
                Tasks
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/calendar")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/calendar"
            title="Calendar"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/calendar")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              calendar_month
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/calendar") ? "font-semibold" : "font-medium"}`}
              >
                Calendar
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/activity")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/activity"
            title="Activity Log"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/activity")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              list_alt
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/activity") ? "font-semibold" : "font-medium"}`}
              >
                Activity Log
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/chat")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/chat"
            title="Chat"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/chat")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              chat_bubble
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/chat") ? "font-semibold" : "font-medium"}`}
              >
                Chat
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/team")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/team"
            title="Team"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive("/team")
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              group
            </span>
            {!sidebarCollapsed && (
              <p
                className={`text-sm ${isActive("/team") ? "font-semibold" : "font-medium"}`}
              >
                Team
              </p>
            )}
          </Link>
          <Link
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${
              isActive("/coming-soon") && location.pathname.includes("setting")
                ? "bg-blue-600/10 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            to="/coming-soon"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
            {!sidebarCollapsed && (
              <p className="text-sm font-medium">Settings</p>
            )}
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-slate-100">
        <div
          className={`flex items-center gap-3 px-2 ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold">
            {user?.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "U"}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.role || "Member"}
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={logout}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600"
              title="Logout"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
