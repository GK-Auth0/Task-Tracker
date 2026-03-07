import React from "react";
import {
  AiAutoInsights,
  AiChatContextResult,
  AiWorkloadForecast,
} from "../../services/aiAssistant";

interface DashboardAiPanelProps {
  loading: boolean;
  error: string;
  autoInsights: AiAutoInsights | null;
  workload: AiWorkloadForecast | null;
  actionReply: AiChatContextResult | null;
  actionLoading: boolean;
  onRunAction: (prompt: string) => void;
}

const riskTone = (risk?: AiAutoInsights["risk_level"]) => {
  if (risk === "High") return "bg-rose-100 text-rose-700";
  if (risk === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const pressureTone = (pressure?: AiWorkloadForecast["pressure"]) => {
  if (pressure === "High") return "text-rose-700";
  if (pressure === "Medium") return "text-amber-700";
  return "text-emerald-700";
};

const DashboardAiPanel: React.FC<DashboardAiPanelProps> = ({
  loading,
  error,
  autoInsights,
  workload,
  actionReply,
  actionLoading,
  onRunAction,
}) => {
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-blue-900">AI Dashboard Insights</h3>
          <p className="mt-0.5 text-xs text-blue-900/80">
            Generated from AI workspace analysis in real time
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskTone(autoInsights?.risk_level)}`}
        >
          {autoInsights?.risk_level || "Low"} Risk
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-blue-900/80">Analyzing dashboard workload...</p>
      ) : error ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-blue-900">{autoInsights?.summary || "No summary available."}</p>
          {autoInsights?.snapshot_lines?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-blue-900/80">
              {autoInsights.snapshot_lines.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          ) : null}

          {workload && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-white/80 p-3">
              <p className="text-xs font-semibold text-blue-900">
                Next {workload.window_days} days forecast
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <span>{workload.due_task_count} tasks due</span>
                <span>{workload.estimated_hours} estimated hours</span>
                <span>{workload.high_priority_due_count} high-priority due</span>
                <span className={`font-semibold ${pressureTone(workload.pressure)}`}>
                  {workload.pressure} pressure
                </span>
              </div>
            </div>
          )}

          {autoInsights?.quick_actions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {autoInsights.quick_actions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onRunAction(prompt)}
                  disabled={actionLoading}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3 min-h-[64px]">
            <p className="text-xs font-semibold text-blue-900">AI Response</p>
            <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
              {actionLoading
                ? "Thinking..."
                : actionReply?.reply || "Select a quick action to get a targeted AI response."}
            </p>
          </div>
        </>
      )}
    </section>
  );
};

export default DashboardAiPanel;
