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
    <div className="rounded-xl border border-slate-200 bg-white p-1.5">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-lg text-left transition-colors ${
              compact
                ? `px-3 py-2 text-xs font-semibold ${
                    value === item.key
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                : `flex min-w-[150px] flex-1 items-start gap-2.5 px-3 py-3 ${
                    value === item.key
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
            }`}
          >
            {!compact && item.icon ? (
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
