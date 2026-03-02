import React from "react";

interface AuthShowcaseProps {
  title: string;
  subtitle: string;
  highlights: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
}

const AuthShowcase: React.FC<AuthShowcaseProps> = ({
  title,
  subtitle,
  highlights,
}) => {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 text-white p-10">
      <div className="absolute -top-16 -right-12 size-48 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="absolute -bottom-16 -left-12 size-52 rounded-full bg-blue-400/20 blur-2xl" />
      <div className="absolute right-8 top-24 size-20 rounded-full border border-white/20" />
      <div className="absolute left-10 bottom-28 size-12 rounded-full border border-white/25" />

      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
          <span className="size-2 rounded-full bg-cyan-300 animate-pulse" />
          Personal Workspace
        </p>
        <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight">
          {title}
        </h2>
        <p className="mt-4 max-w-sm text-sm text-blue-100/90 leading-6">
          {subtitle}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3">
        {highlights.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-blue-100/80">
                {item.label}
              </p>
              <p className="text-sm font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default AuthShowcase;
