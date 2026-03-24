import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
            Settings
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Workspace Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account, notifications, and workspace options.
          </p>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Notifications
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: "Task assignments",
                  helper: "Get alerted when a task is assigned to you.",
                },
                {
                  label: "Due date reminders",
                  helper: "Receive reminders 24 hours before due dates.",
                },
                {
                  label: "Project updates",
                  helper: "Stay informed about project status changes.",
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{item.helper}</p>
                  </div>
                  <input type="checkbox" className="mt-1 h-4 w-4" defaultChecked />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Security
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/change-password")}
                className="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Change Password
              </button>
              <button className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Enable 2FA
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Workspace
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/team")}
                className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Manage Team
              </button>
              <button className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Invite Members
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Usage Summary
            </h3>
            <div className="text-xs text-slate-500 space-y-2">
              <p>Active projects: 5</p>
              <p>Open tasks: 23</p>
              <p>Team members: 8</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Support
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Need help? Visit our support hub or contact the team.
            </p>
            <button
              onClick={() => navigate("/help")}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Open Help Center
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
