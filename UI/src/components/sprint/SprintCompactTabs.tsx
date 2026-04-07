type SprintCompactTabItem<T extends string> = {
  key: T;
  label: string;
  icon?: string;
};

interface SprintCompactTabsProps<T extends string> {
  items: Array<SprintCompactTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
}

export default function SprintCompactTabs<T extends string>({
  items,
  value,
  onChange,
}: SprintCompactTabsProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
            value === item.key
              ? "bg-blue-600 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {item.icon ? (
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          ) : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}
