import { useAuth } from "../contexts/AuthContext";
import { getFullName, getUserInitials } from "../utils/user";
import { Link, useLocation } from "react-router-dom";
import {
  hasMinimumWorkspaceRole,
  isWorkspaceAdmin,
  type WorkspaceRole,
} from "../types/roles";
import TopAccentLine from "./layout/TopAccentLine";

interface SidebarProps {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  isDesktopView: boolean;
  onToggleDesktopCollapse: () => void;
  onCloseMobile: () => void;
}

type NavItem = {
  path: string;
  title: string;
  icon: string;
  minRole?: WorkspaceRole;
};

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", title: "Dashboard", icon: "dashboard" },
  { path: "/tasks", title: "Tasks", icon: "check_box" },
  { path: "/projects", title: "Projects", icon: "folder_open" },
  { path: "/calendar", title: "Calendar", icon: "calendar_month" },
  { path: "/analytics", title: "Analytics", icon: "analytics" },
  { path: "/sprint-board", title: "Sprint Boards", icon: "view_kanban" },
  { path: "/test-cases", title: "Test Cases", icon: "fact_check" },
  { path: "/test-defects", title: "Defects", icon: "bug_report" },
  { path: "/activity", title: "Activity Log", icon: "list_alt" },
  { path: "/chat", title: "Chat", icon: "chat_bubble" },
  { path: "/ai-monitoring", title: "AI Monitoring", icon: "monitoring" },
  { path: "/team", title: "Team", icon: "group", minRole: "Admin" as const },
  { path: "/settings", title: "Settings", icon: "settings" },
];

export default function Sidebar({
  isDesktopCollapsed,
  isMobileOpen,
  isDesktopView,
  onToggleDesktopCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isCollapsed = isDesktopView ? isDesktopCollapsed : false;
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.minRole ? hasMinimumWorkspaceRole(user?.role, item.minRole) : true,
  );

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-300 lg:relative lg:z-0 overflow-hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isCollapsed ? "w-20 p-3" : "w-72 p-6"
        }`}
      >
        <TopAccentLine />
        <div className="flex flex-col gap-6 min-h-0 h-full">
          {/* Logo/Brand and Toggle */}
          <div
            className={`flex gap-3 ${
              isCollapsed
                ? "flex-col items-center justify-center"
                : "items-center justify-between"
            }`}
          >
            <div className="flex gap-3 items-center overflow-hidden">
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-blue-600 rounded-lg size-10 flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide text-gray-700">
                    TT
                  </span>
                </div>
              ) : (
                <>
                  <div className="bg-blue-600 rounded-lg size-10 flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h1 className="text-gray-900 text-base font-bold leading-tight truncate">
                      TaskTracker
                    </h1>
                    <p className="text-gray-600 text-xs font-normal truncate">
                      Pro Team Edition
                    </p>
                  </div>
                </>
              )}
            </div>

            <div
              className={`flex items-center gap-2 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                title="Close sidebar"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <button
                onClick={onToggleDesktopCollapse}
                className={`hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ${
                  isCollapsed ? "mt-1" : ""
                }`}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <span className="material-symbols-outlined text-lg">
                  {isCollapsed ? "chevron_right" : "chevron_left"}
                </span>
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 overflow-y-auto pr-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                    isActive(item.path)
                      ? "bg-blue-600/10 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                }`}
                to={item.path}
                title={item.title}
                onClick={() => {
                  if (!isDesktopView) onCloseMobile();
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: isActive(item.path)
                      ? "'FILL' 1"
                      : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <p
                    className={`text-sm ${
                      isActive(item.path)
                        ? "font-semibold"
                        : "font-medium"
                    }`}
                  >
                    {item.title}
                  </p>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100">
          <div
            className={`flex items-center gap-3 px-2 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold shrink-0">
              {getUserInitials(user)}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {getFullName(user)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role || "Member"}{isWorkspaceAdmin(user?.role) ? " • Workspace Admin" : ""}
                </p>
              </div>
            )}
            {!isCollapsed && (
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
    </>
  );
}
