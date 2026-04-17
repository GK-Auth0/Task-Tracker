import type { ReactNode } from "react";
import StaticDataBanner from "./StaticDataBanner";

interface WorkspacePageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  metaLabel: string;
  metaValue: string;
  actions?: ReactNode;
  metaPosition?: "inline" | "right";
  showMeta?: boolean;
  showStaticBanner?: boolean;
}

export default function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  metaLabel,
  metaValue,
  actions,
  metaPosition = "inline",
  showMeta = true,
  showStaticBanner = true,
}: WorkspacePageHeaderProps) {
  const metaPill = showMeta ? (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {metaLabel}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{metaValue}</p>
    </div>
  ) : null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">

        {/* ── Left: title block ── */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>

        {/* ── Right: meta + actions ── */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {showStaticBanner ? <StaticDataBanner /> : null}
          {metaPosition === "inline" || metaPosition === "right" ? metaPill : null}
          {actions}
        </div>

      </div>
    </div>
  );
}
