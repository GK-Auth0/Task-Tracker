interface SprintTrendChartProps {
  points: Array<{
    date: string;
    added: number;
    completed: number;
    in_progress: number;
  }>;
}

const formatShortDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function SprintTrendChart({ points }: SprintTrendChartProps) {
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.added, point.completed, point.in_progress]),
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">7-day sprint activity trend</p>
          <p className="mt-1 text-xs text-slate-500">
            Added vs completed work, plus items recently moved into progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Added
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            In progress
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {points.map((point) => (
          <div key={point.date} className="flex min-h-[150px] flex-col items-center justify-end gap-2">
            <div className="flex h-[118px] items-end gap-1">
              {[
                { key: "added", value: point.added, color: "bg-slate-400" },
                { key: "completed", value: point.completed, color: "bg-emerald-500" },
                { key: "in_progress", value: point.in_progress, color: "bg-blue-500" },
              ].map((bar) => (
                <div key={bar.key} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-500">{bar.value}</span>
                  <div
                    className={`w-3.5 rounded-t-md ${bar.color}`}
                    style={{ height: `${Math.max(6, (bar.value / maxValue) * 92)}px` }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {formatShortDate(point.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
