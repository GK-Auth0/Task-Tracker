interface SuiteItem {
  name: string;
  count: number;
}

interface TestCaseSuiteStripProps {
  items: SuiteItem[];
  value: string;
  onChange: (value: string) => void;
}

export default function TestCaseSuiteStrip({
  items,
  value,
  onChange,
}: TestCaseSuiteStripProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Suites</h2>
          <p className="mt-1 text-xs text-slate-500">
            Narrow the catalog without jumping between columns.
          </p>
        </div>
        <span className="material-symbols-outlined rounded-xl bg-blue-50 p-2 text-blue-600">
          folder_open
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = value === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onChange(item.name)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.name} ({item.count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
