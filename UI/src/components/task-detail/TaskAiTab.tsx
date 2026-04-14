import { AiTaskSuggestion } from "../../services/aiAssistant";

interface TaskAiTabProps {
  aiSuggestion: AiTaskSuggestion | null;
  aiLoading: boolean;
  aiError: string;
  prioritySaving: boolean;
  onPriorityUpdate: (priority: "Low" | "Medium" | "High") => void;
  onRefreshAi: () => void;
}

export default function TaskAiTab({
  aiSuggestion,
  aiLoading,
  aiError,
  prioritySaving,
  onPriorityUpdate,
  onRefreshAi,
}: TaskAiTabProps) {
  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            AI Assistant
          </p>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-950">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Task insights
          </h3>
        </div>
        <button
          className="h-8 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          onClick={onRefreshAi}
          disabled={aiLoading}
        >
          {aiLoading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {aiError && (
        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
          {aiError}
        </p>
      )}

      {aiLoading && !aiSuggestion ? (
        <div className="rounded-lg border border-blue-200 bg-white p-4 text-sm text-slate-600">
          Generating AI guidance for this task...
        </div>
      ) : null}

      {aiSuggestion ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Suggested Priority
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{aiSuggestion.priority}</p>
            <button
              className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
              onClick={() => onPriorityUpdate(aiSuggestion.priority)}
              disabled={prioritySaving}
            >
              {prioritySaving ? "Applying..." : "Apply priority"}
            </button>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Suggested Due Date
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {new Date(aiSuggestion.due_date).toLocaleDateString()}
            </p>
            <p className="mt-2 text-xs text-slate-600">Est. {aiSuggestion.estimated_hours}h effort</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Why</p>
            <p className="mt-1 text-sm text-slate-700">{aiSuggestion.reason}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-3 lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Suggested Checklist
            </p>
            <ul className="mt-2 space-y-1">
              {aiSuggestion.checklist.map((item) => (
                <li key={item} className="text-sm text-slate-700">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!aiLoading && !aiSuggestion && !aiError ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-white/80 p-4 text-sm text-slate-600">
          Click refresh to generate AI suggestions for this task.
        </div>
      ) : null}
    </div>
  );
}
