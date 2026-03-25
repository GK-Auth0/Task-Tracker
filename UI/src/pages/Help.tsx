export default function Help() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
          Help Center
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
          How can we help?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quick answers and guides to keep your team moving.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "Getting Started",
            body: "Create your first project, add tasks, and invite teammates.",
          },
          {
            title: "Invites & Access",
            body: "Manage team invites, roles, and workspace permissions.",
          },
          {
            title: "AI Assistant",
            body: "Use smart suggestions, forecasts, and insights effectively.",
          },
          {
            title: "Account & Security",
            body: "Reset passwords, enable 2FA, and secure your account.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {card.title}
            </h3>
            <p className="text-xs text-slate-500">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Contact Support
        </h3>
        <p className="text-xs text-slate-500">
          Email us at support@tasktracker.local for help.
        </p>
      </div>
    </div>
  );
}
