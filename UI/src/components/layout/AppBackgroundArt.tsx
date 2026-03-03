import React from "react";

const AppBackgroundArt: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-35">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.12),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.1),transparent_34%),radial-gradient(circle_at_50%_85%,rgba(14,116,144,0.1),transparent_42%)]" />

      <div className="absolute -left-24 top-16 size-72 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="absolute right-8 bottom-0 size-80 rounded-full bg-cyan-200/30 blur-3xl" />

      <svg
        className="hidden md:block absolute left-10 top-14 h-28 w-44 text-slate-300/60"
        viewBox="0 0 176 112"
        fill="none"
      >
        <rect x="1" y="1" width="174" height="110" rx="14" stroke="currentColor" />
        <rect x="16" y="22" width="54" height="10" rx="5" fill="currentColor" fillOpacity="0.35" />
        <rect x="16" y="42" width="146" height="8" rx="4" fill="currentColor" fillOpacity="0.25" />
        <rect x="16" y="56" width="120" height="8" rx="4" fill="currentColor" fillOpacity="0.22" />
        <rect x="16" y="70" width="96" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
      </svg>

      <div className="hidden lg:block absolute right-12 top-24 w-56 rounded-xl border border-slate-200/55 bg-white/45 backdrop-blur-sm p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Task Board
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5 rounded-md bg-slate-100 p-1.5">
            <div className="h-1.5 w-6 rounded bg-slate-300" />
            <div className="h-5 rounded bg-white border border-slate-200" />
          </div>
          <div className="space-y-1.5 rounded-md bg-blue-50 p-1.5">
            <div className="h-1.5 w-6 rounded bg-blue-300" />
            <div className="h-5 rounded bg-white border border-blue-100" />
          </div>
          <div className="space-y-1.5 rounded-md bg-emerald-50 p-1.5">
            <div className="h-1.5 w-6 rounded bg-emerald-300" />
            <div className="h-5 rounded bg-white border border-emerald-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBackgroundArt;
