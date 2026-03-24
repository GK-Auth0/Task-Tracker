import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import AppBackgroundArt from "./layout/AppBackgroundArt";
import AiAssistantWidget from "./ai/AiAssistantWidget";
import NotificationBell from "./layout/NotificationBell";
import GlobalSearch from "./layout/GlobalSearch";

export default function Layout() {
  const { user } = useAuth();
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
          <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3 gap-4">
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
              <button className="hidden sm:block p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>
              <button
                onClick={() => navigate("/profile")}
                className="bg-blue-600/20 text-blue-600 rounded-full size-9 flex items-center justify-center text-xs font-bold hover:bg-blue-600/30 transition-colors cursor-pointer"
              >
                {user?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="relative isolate flex-1 overflow-y-auto">
            <div className="pointer-events-none absolute inset-0 z-0">
              <AppBackgroundArt />
            </div>
            <div className="relative z-10 h-full">
              <Outlet />
            </div>
            <AiAssistantWidget />
          </div>
        </main>
      </div>
    </div>
  );
}
