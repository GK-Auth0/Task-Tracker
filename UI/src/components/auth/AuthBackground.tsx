import React from "react";

const AuthBackground: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-45">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.1),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(30,64,175,0.09),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(56,189,248,0.08),transparent_42%)]" />
      <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="absolute bottom-0 right-6 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      <svg
        className="absolute -right-16 top-16 h-56 w-56 text-slate-300/45"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg
        className="absolute -left-8 bottom-20 h-40 w-40 text-slate-300/40"
        viewBox="0 0 160 160"
        fill="none"
      >
        <path d="M10 120 C40 40, 120 40, 150 120" stroke="currentColor" strokeWidth="2" />
        <path d="M10 140 C40 60, 120 60, 150 140" stroke="currentColor" strokeWidth="2" />
      </svg>

      <div className="hidden md:block absolute left-10 top-24 w-56 rounded-2xl border border-slate-200/45 bg-white/40 backdrop-blur-sm p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Today Tasks
          </p>
          <span className="material-symbols-outlined text-[16px] text-slate-400">
            checklist
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-cyan-200/70 w-4/5" />
          <div className="h-2 rounded-full bg-slate-200/90 w-3/5" />
          <div className="h-2 rounded-full bg-blue-200/70 w-2/3" />
        </div>
      </div>

      <div className="hidden lg:block absolute right-16 bottom-28 w-64 rounded-2xl border border-slate-200/45 bg-white/40 backdrop-blur-sm p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Kanban Flow
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-100 p-2 space-y-1.5">
            <div className="h-1.5 w-8 rounded bg-slate-300" />
            <div className="h-6 rounded bg-white border border-slate-200" />
          </div>
          <div className="rounded-lg bg-blue-50 p-2 space-y-1.5">
            <div className="h-1.5 w-8 rounded bg-blue-300" />
            <div className="h-6 rounded bg-white border border-blue-100" />
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 space-y-1.5">
            <div className="h-1.5 w-8 rounded bg-emerald-300" />
            <div className="h-6 rounded bg-white border border-emerald-100" />
          </div>
        </div>
      </div>

      <svg
        className="hidden lg:block absolute right-72 top-20 h-28 w-44 text-slate-300/60"
        viewBox="0 0 176 112"
        fill="none"
      >
        <rect x="1" y="1" width="174" height="110" rx="14" stroke="currentColor" />
        <rect x="16" y="22" width="54" height="10" rx="5" fill="currentColor" fillOpacity="0.35" />
        <rect x="16" y="42" width="146" height="8" rx="4" fill="currentColor" fillOpacity="0.25" />
        <rect x="16" y="56" width="120" height="8" rx="4" fill="currentColor" fillOpacity="0.22" />
        <rect x="16" y="70" width="96" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
      </svg>
    </div>
  );
};

export default AuthBackground;
