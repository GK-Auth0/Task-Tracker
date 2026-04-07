import type { ReactNode } from "react";

interface SprintSectionCardProps {
  eyebrow: string;
  title: string;
  badge?: string;
  children: ReactNode;
}

export default function SprintSectionCard({
  eyebrow,
  title,
  badge,
  children,
}: SprintSectionCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {badge ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
