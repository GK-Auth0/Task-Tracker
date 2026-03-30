import type { ReactNode } from "react";
import StaticDataBanner from "./StaticDataBanner";

interface WorkspacePageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  metaLabel: string;
  metaValue: string;
  actions?: ReactNode;
}

export default function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  metaLabel,
  metaValue,
  actions,
}: WorkspacePageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
            {description}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
            {metaLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">
            {metaValue}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <StaticDataBanner />
        {actions}
      </div>
    </div>
  );
}
