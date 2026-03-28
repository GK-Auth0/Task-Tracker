interface StaticDataBannerProps {
  title?: string;
  message?: string;
}

export default function StaticDataBanner({
  title = "Work In Progress",
  message = "This page currently shows static demo data. Dynamic data wiring can be added later.",
}: StaticDataBannerProps) {
  return (
    <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left shadow-sm">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600">info</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            {title}
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-900">{message}</p>
        </div>
      </div>
    </div>
  );
}
