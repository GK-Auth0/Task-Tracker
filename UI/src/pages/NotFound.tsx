import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.14),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_55%_90%,rgba(14,116,144,0.1),transparent_45%)]" />
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/40 sm:p-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <span className="material-symbols-outlined">error</span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Error 404
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              You took a wrong turn.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              The page you requested is not available. The URL{" "}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                {location.pathname}
              </span>{" "}
              could be moved, deleted, or mistyped.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                {user ? "Go to Dashboard" : "Go to Login"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-11 px-5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => navigate(user ? "/projects" : "/register")}
                className="h-11 px-5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                {user ? "Open Projects" : "Create Account"}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/40 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Navigation
            </p>
            <p className="mt-2 text-7xl font-black leading-none text-slate-900">404</p>
            <p className="mt-3 text-sm text-slate-600">
              Jump to a known page:
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <QuickLink
                label="Dashboard"
                icon="dashboard"
                onClick={() => navigate("/dashboard")}
              />
              <QuickLink
                label="Tasks"
                icon="check_circle"
                onClick={() => navigate("/tasks")}
              />
              <QuickLink
                label="Projects"
                icon="folder_open"
                onClick={() => navigate("/projects")}
              />
              <QuickLink
                label="Calendar"
                icon="calendar_month"
                onClick={() => navigate("/calendar")}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 hover:bg-white transition-colors"
    >
      <span>{label}</span>
      <span className="material-symbols-outlined text-[18px] text-blue-600">
        {icon}
      </span>
    </button>
  );
}
