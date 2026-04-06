type TabItem<T extends string> = {
  key: T;
  label: string;
  icon?: string;
  description?: string;
};

interface SprintTabsProps<T extends string> {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}

export default function SprintTabs<T extends string>({
  items,
  value,
  onChange,
  compact = false,
}: SprintTabsProps<T>) {
  return (
    <div className={compact ? "border-b border-slate-200" : "rounded-xl border border-slate-200 bg-white p-2"}>
      <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-2"}`}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`text-left transition-colors ${
              compact
                ? `inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold ${
                    value === item.key
                      ? "border-slate-200 bg-white text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                  }`
                : `flex min-w-[170px] flex-1 items-start gap-3 rounded-lg border px-3.5 py-3 ${
                    value === item.key
                      ? "border-blue-200 bg-blue-50/70 text-slate-900 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`
            }`}
          >
            {item.icon ? (
              <span className="material-symbols-outlined mt-0.5 text-[18px]">
                {item.icon}
              </span>
            ) : null}
            <span>
              <span className={compact ? "block" : "block text-sm font-semibold"}>
                {item.label}
              </span>
              {!compact && item.description ? (
                <span className="mt-0.5 block text-[11px] text-inherit/80">
                  {item.description}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
