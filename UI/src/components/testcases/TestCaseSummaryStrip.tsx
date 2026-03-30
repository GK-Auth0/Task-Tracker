interface SummaryItem {
  label: string;
  value: string | number;
  note: string;
  icon: string;
}

interface TestCaseSummaryStripProps {
  items: SummaryItem[];
}

export default function TestCaseSummaryStrip({
  items,
}: TestCaseSummaryStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{item.value}</p>
            </div>
            <span className="material-symbols-outlined rounded-lg bg-blue-50 p-1.5 text-[18px] text-blue-600">
              {item.icon}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
