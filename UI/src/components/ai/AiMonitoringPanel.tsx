import { useEffect, useMemo, useState } from "react";
import {
  aiAssistantAPI,
  AiServiceHealth,
  AiServiceMetrics,
} from "../../services/aiAssistant";

const POLL_INTERVAL_MS = 15000;

const formatUptime = (seconds: number) => {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rem = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rem}s`;
  return `${rem}s`;
};

export default function AiMonitoringPanel() {
  const [health, setHealth] = useState<AiServiceHealth | null>(null);
  const [metrics, setMetrics] = useState<AiServiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMonitoring = async () => {
    try {
      setError("");
      const [healthData, metricsData] = await Promise.all([
        aiAssistantAPI.getHealth(),
        aiAssistantAPI.getMetrics(),
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
    } catch (err) {
      setError("AI monitoring unavailable right now.");
      setHealth(null);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
    const timer = window.setInterval(fetchMonitoring, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const endpoints = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.endpoints)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4);
  }, [metrics]);

  return (
    <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              monitoring
            </span>
            AI Monitoring
          </p>
          <p className="text-xs text-emerald-900/80 mt-1">
            Live health and performance for assistant service.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMonitoring}
          className="h-9 px-4 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          {error}
        </p>
      )}

      {!error && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {loading ? "Checking..." : health?.ok ? "Healthy" : "Down"}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Uptime
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {loading || !metrics ? "..." : formatUptime(metrics.uptime_seconds)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Requests
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {loading || !metrics ? "..." : metrics.requests_total}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Errors
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {loading || !metrics ? "..." : metrics.errors_total}
            </p>
          </div>
        </div>
      )}

      {!error && endpoints.length > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Endpoints
          </p>
          <div className="mt-2 space-y-1.5">
            {endpoints.map(([path, metric]) => (
              <div
                key={path}
                className="flex items-center justify-between text-sm text-slate-700"
              >
                <span className="font-medium">{path}</span>
                <span>
                  {metric.count} req • {metric.avg_ms} ms avg • {metric.errors} err
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
