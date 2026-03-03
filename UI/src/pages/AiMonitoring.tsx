import { useEffect, useMemo, useState } from "react";
import {
  aiAssistantAPI,
  AiDayPlan,
  AiProjectInsights,
  AiServiceHealth,
  AiServiceMetrics,
} from "../services/aiAssistant";
import { aiChatAPI } from "../services/aiChat";
import { tasksAPI, Task } from "../services/dashboard";

const REFRESH_OPTIONS = [15, 30, 60] as const;

const formatUptime = (seconds: number) => {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getRiskBadge = (risk?: AiProjectInsights["risk_level"]) => {
  if (risk === "High") return "bg-red-100 text-red-700";
  if (risk === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const mapTasksForAi = (tasks: Task[]) =>
  tasks.map((task) => ({
    title: task.title,
    priority: task.priority,
    due_date: task.due_date,
    estimated_hours: 2,
    status: task.status,
  }));

export default function AiMonitoring() {
  const [health, setHealth] = useState<AiServiceHealth | null>(null);
  const [metrics, setMetrics] = useState<AiServiceMetrics | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(true);
  const [monitorError, setMonitorError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshEvery, setRefreshEvery] = useState<(typeof REFRESH_OPTIONS)[number]>(30);

  const [insights, setInsights] = useState<AiProjectInsights | null>(null);
  const [dayPlan, setDayPlan] = useState<AiDayPlan | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState("");
  const [tasksAnalyzed, setTasksAnalyzed] = useState(0);

  const [ask, setAsk] = useState("What should I prioritize this week based on current work?");
  const [askMode, setAskMode] = useState<"concise" | "balanced" | "detailed">("balanced");
  const [answer, setAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);

  const endpointRows = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.endpoints).sort((a, b) => b[1].count - a[1].count);
  }, [metrics]);

  const successRate = useMemo(() => {
    if (!metrics || metrics.requests_total === 0) return "0%";
    const ok = Math.max(0, metrics.requests_total - metrics.errors_total);
    return `${Math.round((ok / metrics.requests_total) * 100)}%`;
  }, [metrics]);

  const loadMonitoring = async () => {
    try {
      setMonitorError("");
      const [healthData, metricsData] = await Promise.all([
        aiAssistantAPI.getHealth(),
        aiAssistantAPI.getMetrics(),
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setMonitorError("Could not fetch AI service monitoring data.");
      setHealth(null);
      setMetrics(null);
    } finally {
      setMonitorLoading(false);
    }
  };

  const runWorkspaceAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisError("");
      const taskResponse = await tasksAPI.getTasks({ limit: 60, page: 1 });
      const usableTasks = (taskResponse.data || []).slice(0, 30);
      setTasksAnalyzed(usableTasks.length);

      if (usableTasks.length === 0) {
        setInsights(null);
        setDayPlan(null);
        setAnalysisError("No tasks found to analyze.");
        return;
      }

      const aiTasks = mapTasksForAi(usableTasks);
      const [insightData, planData] = await Promise.all([
        aiAssistantAPI.projectInsights(aiTasks),
        aiAssistantAPI.planDay(aiTasks, 6),
      ]);
      setInsights(insightData);
      setDayPlan(planData);
    } catch (error) {
      setInsights(null);
      setDayPlan(null);
      setAnalysisError("AI analysis failed. Please retry.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const runAskAssistant = async () => {
    const prompt = ask.trim();
    if (!prompt) return;
    try {
      setAskLoading(true);
      const response = await aiChatAPI.chat(prompt, "/ai-monitoring", askMode);
      setAnswer(response.data.reply || "No response.");
    } catch {
      setAnswer("Assistant unavailable right now. Try again shortly.");
    } finally {
      setAskLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
    runWorkspaceAnalysis();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(loadMonitoring, refreshEvery * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshEvery]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">AI Monitoring</h2>
              <p className="mt-1 text-sm text-slate-500">
                Dedicated monitoring and AI insights for your workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadMonitoring}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh Monitoring
              </button>
              <button
                type="button"
                onClick={runWorkspaceAnalysis}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Re-run AI Analysis
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-emerald-900">Service Telemetry</p>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <select
                value={refreshEvery}
                onChange={(e) => setRefreshEvery(Number(e.target.value) as (typeof REFRESH_OPTIONS)[number])}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                disabled={!autoRefresh}
              >
                {REFRESH_OPTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Every {sec}s
                  </option>
                ))}
              </select>
            </div>
          </div>

          {monitorError ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {monitorError}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <MetricCard
                  label="Status"
                  value={monitorLoading ? "Checking..." : health?.ok ? "Healthy" : "Down"}
                />
                <MetricCard
                  label="Uptime"
                  value={monitorLoading || !metrics ? "..." : formatUptime(metrics.uptime_seconds)}
                />
                <MetricCard
                  label="Requests"
                  value={monitorLoading || !metrics ? "..." : String(metrics.requests_total)}
                />
                <MetricCard
                  label="Errors"
                  value={monitorLoading || !metrics ? "..." : String(metrics.errors_total)}
                />
                <MetricCard label="Success" value={monitorLoading ? "..." : successRate} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Last updated: {lastUpdated || "not yet"}
              </p>
              {endpointRows.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                  <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span className="col-span-5">Endpoint</span>
                    <span className="col-span-2 text-right">Requests</span>
                    <span className="col-span-2 text-right">Errors</span>
                    <span className="col-span-3 text-right">Avg Latency</span>
                  </div>
                  {endpointRows.slice(0, 8).map(([path, metric]) => (
                    <div key={path} className="grid grid-cols-12 border-t border-slate-100 px-3 py-2 text-sm">
                      <span className="col-span-5 truncate font-medium text-slate-700">{path}</span>
                      <span className="col-span-2 text-right text-slate-700">{metric.count}</span>
                      <span className="col-span-2 text-right text-slate-700">{metric.errors}</span>
                      <span className="col-span-3 text-right text-slate-700">{metric.avg_ms} ms</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">AI Workspace Analysis</p>
            <span className="text-xs text-slate-500">Tasks analyzed: {tasksAnalyzed}</span>
          </div>
          {analysisLoading ? (
            <p className="text-sm text-slate-500">Analyzing workspace data...</p>
          ) : analysisError ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {analysisError}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">Project Insights</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getRiskBadge(insights?.risk_level)}`}
                  >
                    {insights?.risk_level || "Low"} Risk
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{insights?.summary || "No summary."}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {(insights?.recommendations || []).slice(0, 4).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Today Plan</p>
                <p className="mt-1 text-xs text-slate-500">
                  Focus {dayPlan?.focus_hours || 0}h, planned {dayPlan?.planned_hours || 0}h
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {(dayPlan?.today_plan || []).slice(0, 5).map((item) => (
                    <li key={item.title}>- {item.title}</li>
                  ))}
                </ul>
                {dayPlan?.tip && <p className="mt-3 text-xs text-slate-500">Tip: {dayPlan.tip}</p>}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-slate-900">Ask AI (Detailed)</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <textarea
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              className="min-h-[96px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ask AI about prioritization, delivery risk, blockers, or planning."
            />
            <div className="flex flex-row items-start gap-2 md:flex-col">
              <select
                value={askMode}
                onChange={(e) => setAskMode(e.target.value as "concise" | "balanced" | "detailed")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="concise">Concise</option>
                <option value="balanced">Balanced</option>
                <option value="detailed">Detailed</option>
              </select>
              <button
                type="button"
                onClick={runAskAssistant}
                disabled={askLoading || !ask.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {askLoading ? "Thinking..." : "Run"}
              </button>
            </div>
          </div>
          {answer && (
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {answer}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
