import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { aiChatAPI, type AiChatHistoryItem } from "../../services/aiChat";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function AiAssistantWidget() {
  const storedPrefs =
    typeof window !== "undefined"
      ? localStorage.getItem("ai_widget_prefs")
      : null;
  let parsedPrefs: {
    position?: "right" | "left";
    responseMode?: "concise" | "balanced" | "detailed";
    accent?: "blue" | "emerald" | "rose";
  } | null = null;
  if (storedPrefs) {
    try {
      parsedPrefs = JSON.parse(storedPrefs);
    } catch {
      parsedPrefs = null;
    }
  }
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState<"insights" | "chat">("insights");
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [contextSnapshot, setContextSnapshot] = useState("");
  const [dynamicQuickPrompts, setDynamicQuickPrompts] = useState<string[]>([]);
  const [sources, setSources] = useState<
    Array<{ id?: string; type?: string; title: string; snippet?: string }>
  >([]);
  const [position, setPosition] = useState<"right" | "left">(
    parsedPrefs?.position === "left" ? "left" : "right",
  );
  const [responseMode, setResponseMode] = useState<
    "concise" | "balanced" | "detailed"
  >(
    parsedPrefs?.responseMode === "concise" ||
      parsedPrefs?.responseMode === "detailed"
      ? parsedPrefs.responseMode
      : "balanced",
  );
  const [accent, setAccent] = useState<"blue" | "emerald" | "rose">(
    parsedPrefs?.accent === "emerald" || parsedPrefs?.accent === "rose"
      ? parsedPrefs.accent
      : "blue",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi, I can help with prioritization, planning, risk checks, and breaking tasks into steps.",
    },
  ]);
  const location = useLocation();

  const fallbackQuickPrompts = [
    "Plan my day from current tasks",
    "How should I prioritize this week?",
    "Give me project risk checks",
  ];

  const getPromptForPath = (pathname: string) => {
    if (pathname.startsWith("/dashboard")) {
      return "Give top 3 useful insights from my current tasks and what I should do next today.";
    }
    if (pathname.startsWith("/projects")) {
      return "Give top 3 project insights and one recommendation to reduce risk.";
    }
    if (pathname.startsWith("/calendar")) {
      return "Give top 3 schedule insights from my tasks and due dates this week.";
    }
    if (pathname.startsWith("/activity")) {
      return "Give top 3 insights from recent activity and one trend to watch.";
    }
    if (pathname.startsWith("/chat")) {
      return "Give top 3 collaboration tips based on my current workload context.";
    }
    if (pathname.startsWith("/ai-monitoring")) {
      return "Give top 3 operational AI insights and one recommendation to improve delivery confidence this week.";
    }
    return "Give top 3 useful project-management insights from my current data.";
  };

  const routePrompt = useMemo(
    () => getPromptForPath(location.pathname),
    [location.pathname],
  );

  const parseInsightLines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.toLowerCase().startsWith("context snapshot:"))
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, ""))
      .slice(0, 3);

  const accentClasses = {
    blue: {
      bubble: "bg-blue-600 hover:bg-blue-700",
      send: "bg-blue-600 hover:bg-blue-700",
      user: "bg-blue-600",
    },
    emerald: {
      bubble: "bg-emerald-600 hover:bg-emerald-700",
      send: "bg-emerald-600 hover:bg-emerald-700",
      user: "bg-emerald-600",
    },
    rose: {
      bubble: "bg-rose-600 hover:bg-rose-700",
      send: "bg-rose-600 hover:bg-rose-700",
      user: "bg-rose-600",
    },
  }[accent];

  const persistPrefs = (
    next: Partial<{
      position: "right" | "left";
      responseMode: "concise" | "balanced" | "detailed";
      accent: "blue" | "emerald" | "rose";
    }>,
  ) => {
    const merged = {
      position,
      responseMode,
      accent,
      ...next,
    };
    localStorage.setItem("ai_widget_prefs", JSON.stringify(merged));
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError("");
      const response = await aiChatAPI.chat(
        routePrompt,
        location.pathname,
        "concise",
      );
      const reply = response.data.reply || "";
      const lines = parseInsightLines(reply);
      setInsights(lines.length ? lines : ["No insights available right now."]);
      setContextSnapshot(response.data.contextSnapshot || "");
      setDynamicQuickPrompts(
        response.data.quickActions?.length
          ? response.data.quickActions
          : fallbackQuickPrompts,
      );
      setSources(response.data.sources || []);
    } catch (error) {
      setInsightsError("AI insights unavailable.");
      setInsights([]);
      setContextSnapshot("");
      setDynamicQuickPrompts(fallbackQuickPrompts);
      setSources([]);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchInsights();
  }, [isOpen, location.pathname]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: "user" as const, text: message }];
    const history: AiChatHistoryItem[] = nextMessages
      .slice(-8)
      .map((item) => ({ role: item.role, text: item.text }));

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await aiChatAPI.chat(
        message,
        location.pathname,
        responseMode,
        history,
      );
      if (response.data.quickActions?.length) {
        setDynamicQuickPrompts(response.data.quickActions);
      }
      if (response.data.contextSnapshot) {
        setContextSnapshot(response.data.contextSnapshot);
      }
      setSources(response.data.sources || []);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.data.reply || "No response." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "AI assistant is temporarily unavailable. Please try again in a moment.",
        },
      ]);
      setDynamicQuickPrompts(fallbackQuickPrompts);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed bottom-5 z-[70] ${
        position === "right" ? "right-5" : "left-5"
      }`}
    >
      {isOpen && (
        <div className="mb-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                AI Assistant
              </p>
              <p className="text-[11px] text-slate-300">Local + safe mode</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-white/10"
                onClick={() => setShowSettings((prev) => !prev)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  tune
                </span>
              </button>
              <button
                className="p-1 rounded hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Position</p>
                <select
                  value={position}
                  onChange={(e) => {
                    const next = e.target.value as "right" | "left";
                    setPosition(next);
                    persistPrefs({ position: next });
                  }}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Response Mode
                </p>
                <select
                  value={responseMode}
                  onChange={(e) => {
                    const next = e.target.value as
                      | "concise"
                      | "balanced"
                      | "detailed";
                    setResponseMode(next);
                    persistPrefs({ responseMode: next });
                  }}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Accent</p>
                <div className="flex items-center gap-2">
                  {(["blue", "emerald", "rose"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setAccent(c);
                        persistPrefs({ accent: c });
                      }}
                      className={`h-5 w-5 rounded-full border ${
                        c === "blue"
                          ? "bg-blue-600"
                          : c === "emerald"
                            ? "bg-emerald-600"
                            : "bg-rose-600"
                      } ${accent === c ? "ring-2 ring-slate-400" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <button
                className={`h-7 px-3 rounded-md text-xs font-semibold ${
                  activeView === "insights"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
                onClick={() => setActiveView("insights")}
              >
                Insights
              </button>
              <button
                className={`h-7 px-3 rounded-md text-xs font-semibold ${
                  activeView === "chat"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
                onClick={() => setActiveView("chat")}
              >
                Chat
              </button>
            </div>

            {activeView === "insights" ? (
              <div className="space-y-2">
                {insightsError && (
                  <div className="rounded-lg px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200">
                    {insightsError}
                  </div>
                )}
                {(insightsLoading ? ["Loading...", "Loading...", "Loading..."] : insights).map(
                  (item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-lg px-3 py-2 text-sm bg-white border border-slate-200 text-slate-700"
                    >
                      {item}
                    </div>
                  ),
                )}
                {contextSnapshot && (
                  <p className="text-[11px] text-slate-500">{contextSnapshot}</p>
                )}
                {sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Grounded In
                    </p>
                    {sources.map((source) => (
                      <div
                        key={`${source.id || source.title}-${source.type || "source"}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-xs font-semibold text-slate-700">{source.title}</p>
                        {source.snippet && (
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-3">
                            {source.snippet}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}`}
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? "bg-white border border-slate-200 text-slate-700"
                        : `${accentClasses.user} text-white ml-8`
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div className="rounded-lg px-3 py-2 text-sm bg-white border border-slate-200 text-slate-500">
                    Thinking...
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 bg-white">
            {activeView === "insights" ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  className="h-9 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  onClick={fetchInsights}
                  disabled={insightsLoading}
                >
                  {insightsLoading ? "Refreshing..." : "Refresh Insights"}
                </button>
                <button
                  className={`h-9 px-3 rounded-lg text-white text-xs font-semibold disabled:opacity-50 ${accentClasses.send}`}
                  onClick={() => {
                    setActiveView("chat");
                    sendMessage("Based on current page context and our current conversation, what should I focus on first?");
                  }}
                  disabled={loading}
                >
                  Chat About Current Page
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(dynamicQuickPrompts.length ? dynamicQuickPrompts : fallbackQuickPrompts).map((prompt) => (
                    <button
                      key={prompt}
                      className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI for help..."
                    className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className={`h-10 px-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50 ${accentClasses.send}`}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-14 w-14 rounded-full text-white shadow-xl transition-colors flex items-center justify-center ${accentClasses.bubble}`}
        title="Open AI Assistant"
      >
        <span className="material-symbols-outlined">smart_toy</span>
      </button>
    </div>
  );
}
