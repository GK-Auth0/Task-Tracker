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
    <div className="flex flex-wrap gap-2 xl:flex-nowrap xl:justify-end">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[150px] rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined rounded-md bg-white p-1.5 text-[16px] text-slate-600">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-bold leading-none text-slate-900">{item.value}</p>
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-slate-500">
            {item.note}
          </p>
        </div>
      ))}
    </div>
  );
}
