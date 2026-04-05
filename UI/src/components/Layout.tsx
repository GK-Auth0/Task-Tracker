import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import AppBackgroundArt from "./layout/AppBackgroundArt";
import AiAssistantWidget from "./ai/AiAssistantWidget";
import NotificationBell from "./layout/NotificationBell";
import GlobalSearch from "./layout/GlobalSearch";
import TopAccentLine from "./layout/TopAccentLine";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isDesktopCollapsed));
  }, [isDesktopCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktopView(event.matches);
      if (event.matches) {
        setIsMobileOpen(false);
      }
    };

    setIsDesktopView(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    if (!isDesktopView && isMobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
  }, [isDesktopView, isMobileOpen]);

  useEffect(() => {
    if (!isDesktopView) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isDesktopView]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isProfileOpen]);

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isDesktopCollapsed={isDesktopCollapsed}
          isMobileOpen={isMobileOpen}
          isDesktopView={isDesktopView}
          onToggleDesktopCollapse={() =>
            setIsDesktopCollapsed((previous: boolean) => !previous)
          }
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
          {/* Top Navigation */}
          <header className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur border-b border-slate-200/70 px-4 sm:px-8 py-3 gap-4 shadow-sm relative">
            <TopAccentLine />
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open navigation sidebar"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <button
                className="hidden sm:block p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                onClick={() => navigate("/help")}
              >
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>
              <div className="relative" data-profile-menu>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="bg-blue-600/20 text-blue-600 rounded-full size-9 flex items-center justify-center text-xs font-bold hover:bg-blue-600/30 transition-colors cursor-pointer"
                  aria-label="Open profile menu"
                >
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {user?.full_name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate("/login");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="relative flex-1 overflow-y-auto">
            <div className="pointer-events-none absolute inset-0 z-0">
              <AppBackgroundArt />
            </div>
            <div className="relative h-full flex flex-col">
              <Outlet />
              <footer className="mt-auto border-t border-slate-100 bg-white px-4 sm:px-8 py-4 text-center">
                <p className="text-slate-400 text-xs">
                  © 2026 Task Tracker Inc. All rights reserved.
                </p>
              </footer>
            </div>
            <AiAssistantWidget />
          </div>
        </main>
      </div>
    </div>
  );
}
