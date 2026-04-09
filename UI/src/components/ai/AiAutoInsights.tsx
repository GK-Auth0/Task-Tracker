import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { aiChatAPI } from "../../services/aiChat";

const HIDE_KEY = "ai_auto_insights_hidden";

const getPromptForPath = (pathname: string) => {
  if (pathname.startsWith("/dashboard")) {
    return "Give me top 3 useful insights from my current tasks and what I should do next today.";
  }
  if (pathname.startsWith("/projects")) {
    return "Give me top 3 project-level insights and one short recommendation to reduce risk.";
  }
  if (pathname.startsWith("/calendar")) {
    return "Give me top 3 schedule insights from my tasks and due dates this week.";
  }
  if (pathname.startsWith("/activity")) {
    return "Give me top 3 insights from my recent activity and what trend I should watch.";
  }
  if (pathname.startsWith("/chat")) {
    return "Give me top 3 collaboration tips based on current workload and coordination needs.";
  }
  if (pathname.startsWith("/team")) {
    return "Give me top 3 team coordination insights from my current tasks and projects.";
  }
  return "Give me top 3 useful project-management insights from my current data.";
};

const parseInsightLines = (text: string) => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("context snapshot:"))
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, ""))
    .slice(0, 3);
};

export default function AiAutoInsights() {
  const { pathname } = useLocation();
  const [insights, setInsights] = useState<string[]>([]);
  const [contextSnapshot, setContextSnapshot] = useState("");
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(HIDE_KEY) === "true",
  );

  const prompt = useMemo(() => getPromptForPath(pathname), [pathname]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await aiChatAPI.chat(prompt, pathname, "concise");
      const reply = response.data.reply || "";
      const lines = parseInsightLines(reply);
      setInsights(lines.length > 0 ? lines : ["No insights available right now."]);
      setContextSnapshot(response.data.contextSnapshot || "");
      setQuickActions(response.data.quickActions || []);
    } catch (err) {
      setError("AI insights unavailable.");
      setInsights([]);
      setContextSnapshot("");
      setQuickActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hidden) return;
    fetchInsights();
  }, [pathname, hidden]);

  if (hidden) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
          onClick={() => {
            localStorage.setItem(HIDE_KEY, "false");
            setHidden(false);
          }}
        >
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
          Show AI Insights
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4">
      <section className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cyan-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              AI Auto Insights
            </p>
            <p className="text-xs text-cyan-900/80 mt-1">
              Useful details generated automatically for this page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchInsights}
              disabled={loading}
              className="h-8 px-3 rounded-md bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(HIDE_KEY, "true");
                setHidden(true);
              }}
              className="h-8 px-3 rounded-md border border-cyan-300 bg-white text-cyan-900 text-xs font-semibold hover:bg-cyan-50"
            >
              Hide
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            {error}
          </p>
        )}

        {!error && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            {(loading ? ["Loading...", "Loading...", "Loading..."] : insights).map(
              (item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg border border-cyan-200 bg-white p-3"
                >
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ),
            )}
          </div>
        )}

        {contextSnapshot && (
          <p className="mt-3 text-[11px] text-slate-500">{contextSnapshot}</p>
        )}

        {quickActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <span
                key={action}
                className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-medium text-cyan-900"
              >
                {action}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
