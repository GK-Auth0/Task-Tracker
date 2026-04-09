import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { aiAssistantAPI, AiProjectInsights } from "../services/aiAssistant";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarMonthGrid from "../components/calendar/CalendarMonthGrid";
import CalendarTeamLegend from "../components/calendar/CalendarTeamLegend";
import CalendarSidebar from "../components/calendar/CalendarSidebar";
import { CalendarTask } from "../components/calendar/types";
import { useCalendarData } from "../components/calendar/useCalendarData";

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [calendarType, setCalendarType] = useState<"personal" | "team">(
    "personal",
  );
  const [aiInsights, setAiInsights] = useState<AiProjectInsights | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState("");
  const [contentTab, setContentTab] = useState<
    "calendar" | "insights" | "agenda" | "workload" | "deadlines"
  >("calendar");
  const { tasks, teamMembers, loading } = useCalendarData(user?.id, calendarType);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchCalendarInsights();
    } else {
      setAiInsights(null);
      setAiInsightsError("");
    }
  }, [tasks]);

  const fetchCalendarInsights = async () => {
    try {
      setAiInsightsLoading(true);
      setAiInsightsError("");
      const payload = tasks.map((task) => ({
        title: task.title,
        priority: task.priority as "Low" | "Medium" | "High",
        status: task.status,
        due_date: task.due_date,
      }));
      const result = await aiAssistantAPI.projectInsights(payload);
      setAiInsights(result);
    } catch (error) {
      setAiInsightsError("AI calendar insights unavailable right now.");
      setAiInsights(null);
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getTaskColor = (task: CalendarTask) => {
    if (calendarType === "team" && task.assignee) {
      const member = teamMembers.find((m) => m.id === task.assignee?.id);
      return member?.color || "blue";
    }

    // Color by priority for personal calendar
    switch (task.priority) {
      case "High":
        return "red";
      case "Medium":
        return "amber";
      case "Low":
        return "green";
      default:
        return "blue";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = getDaysInMonth(currentDate);
  const visibleAssignees = tasks
    .filter((task) => task.assignee && task.due_date)
    .map((task) => task.assignee!)
    .filter(
      (assignee, index, arr) => arr.findIndex((a) => a.id === assignee.id) === index,
    );

  const membersWithTasks = visibleAssignees
    .filter((assignee) => teamMembers.some((member) => member.id === assignee.id))
    .map((assignee) => {
    const member = teamMembers.find((m) => m.id === assignee.id);
    return member ? { ...assignee, color: member.color } : { ...assignee, color: "blue" };
    });

  const sortedTasks = [...tasks]
    .filter((task) => task.due_date)
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
    );

  const currentMonthTasks = sortedTasks.filter((task) => {
    if (!task.due_date) return false;
    const date = new Date(task.due_date);
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  });

  const agendaTasks = currentMonthTasks.slice(0, 6);

  const upcomingDeadlines = sortedTasks
    .filter((task) => new Date(task.due_date!).getTime() >= new Date().getTime())
    .slice(0, 5);

  const workloadRows =
    calendarType === "team"
      ? membersWithTasks
          .map((member) => {
            const assignedTasks = tasks.filter((task) => task.assignee?.id === member.id);
            const active = assignedTasks.filter((task) => task.status !== "Done").length;
            const dueSoon = assignedTasks.filter((task) => {
              if (!task.due_date || task.status === "Done") return false;
              const diff =
                (new Date(task.due_date).getTime() - new Date().getTime()) / 86400000;
              return diff >= 0 && diff <= 7;
            }).length;
            return {
              id: member.id,
              name: member.full_name,
              color: member.color,
              active,
              dueSoon,
            };
          })
          .sort((a, b) => b.active - a.active)
      : [];

  const overviewCards = [
    {
      label: "Scheduled This Month",
      value: currentMonthTasks.length,
      note: "Tasks with due dates inside the active month",
      icon: "calendar_month",
    },
    {
      label: "Overdue",
      value: tasks.filter(
        (task) =>
          task.due_date &&
          new Date(task.due_date).getTime() < new Date().getTime() &&
          task.status !== "Done",
      ).length,
      note: "Open tasks that have passed their due date",
      icon: "warning",
    },
    {
      label: "High Priority",
      value: currentMonthTasks.filter((task) => task.priority === "High").length,
      note: "Important tasks scheduled in this month",
      icon: "priority_high",
    },
    {
      label: "Completed",
      value: currentMonthTasks.filter((task) => task.status === "Done").length,
      note: "Tasks already finished this month",
      icon: "task_alt",
    },
  ];

  const contentTabs: Array<{
    key: "calendar" | "agenda" | "workload" | "deadlines";
    label: string;
    icon: string;
  }> = [
    { key: "calendar", label: "Calendar", icon: "calendar_month" },
    { key: "agenda", label: "Agenda", icon: "view_list" },
    { key: "workload", label: "Workload", icon: "groups" },
    { key: "deadlines", label: "Deadlines", icon: "event_upcoming" },
  ];

  return (
    <div className="flex min-h-full flex-col 2xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-12">
        <CalendarHeader
          calendarType={calendarType}
          currentDate={currentDate}
          viewMode={viewMode}
          tasks={tasks}
          monthNames={monthNames}
          onCalendarTypeChange={setCalendarType}
          onViewModeChange={setViewMode}
          onNavigateMonth={navigateMonth}
          onGoToToday={goToToday}
        />

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {contentTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setContentTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    contentTab === tab.key
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setContentTab("insights")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all sm:ml-auto ${
                contentTab === "insights"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                auto_awesome
              </span>
              AI Calendar
            </button>
          </div>
        </section>

        {contentTab === "calendar" && (
          <>
            <CalendarMonthGrid
              days={days}
              loading={loading}
              calendarType={calendarType}
              onGetTasksForDate={getTasksForDate}
              onGetTaskColor={getTaskColor}
              onIsToday={isToday}
            />

            {calendarType === "team" && <CalendarTeamLegend members={membersWithTasks} />}
          </>
        )}

        {contentTab === "insights" && (
          <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                  <span className="material-symbols-outlined text-[18px]">
                    auto_awesome
                  </span>
                  AI Calendar Insights
                </p>
                <p className="mt-1 text-xs text-indigo-900/80">
                  Open this tab when you want suggestions, risk signals, and planning help.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCalendarInsights}
                disabled={aiInsightsLoading || tasks.length === 0}
                className="h-9 w-full rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 sm:w-auto"
              >
                {aiInsightsLoading ? "Analyzing..." : "Refresh AI"}
              </button>
            </div>

            {aiInsightsError && (
              <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                {aiInsightsError}
              </p>
            )}

            {aiInsights ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-indigo-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Summary
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{aiInsights.summary}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-indigo-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Risk
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {aiInsights.risk_level}
                    </p>
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-white p-3 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Signals
                    </p>
                    <ul className="mt-2 space-y-1">
                      {aiInsights.signals.slice(0, 4).map((signal) => (
                        <li key={signal} className="text-sm text-slate-700">
                          • {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              !aiInsightsError && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-4 text-sm text-slate-600">
                  AI insights will appear here after analysis is available for your scheduled tasks.
                </div>
              )
            )}
          </section>
        )}

        {contentTab === "agenda" && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {agendaTasks.length > 0 ? (
                agendaTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {task.title}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                        {new Date(task.due_date!).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{task.project.name}</span>
                      <span>•</span>
                      <span>{task.priority} Priority</span>
                      <span>•</span>
                      <span>{task.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No agenda items for this month.</p>
              )}
            </div>
          </section>
        )}

        {contentTab === "workload" && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {card.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {card.value}
                      </p>
                    </div>
                    <span className="material-symbols-outlined rounded-lg bg-white p-2 text-blue-600 border border-slate-200">
                      {card.icon}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{card.note}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {calendarType === "team" ? (
                workloadRows.length > 0 ? (
                  workloadRows.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="size-3 rounded-full"
                            style={{
                              backgroundColor:
                                row.color === "emerald"
                                  ? "#10b981"
                                  : row.color === "indigo"
                                    ? "#6366f1"
                                    : row.color === "rose"
                                      ? "#f43f5e"
                                      : row.color === "amber"
                                        ? "#f59e0b"
                                        : row.color === "purple"
                                          ? "#a855f7"
                                          : row.color === "green"
                                            ? "#22c55e"
                                            : row.color === "orange"
                                              ? "#f97316"
                                              : "#3b82f6",
                            }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {row.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.active} active tasks • {row.dueSoon} due within 7 days
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {row.active}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No team workload data available yet.
                  </p>
                )
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Switch to the team calendar to see assignee workload and due-soon pressure.
                </div>
              )}
            </div>
          </section>
        )}

        {contentTab === "deadlines" && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => {
                  const dueDate = new Date(task.due_date!);
                  const diffDays = Math.ceil(
                    (dueDate.getTime() - new Date().getTime()) / 86400000,
                  );
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.project.name}
                            {task.assignee ? ` • ${task.assignee.full_name}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-slate-500">
                            Due in {diffDays} day{diffDays !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No upcoming deadlines found.</p>
              )}
            </div>
          </section>
        )}
      </div>

      <CalendarSidebar tasks={tasks} loading={loading} calendarType={calendarType} />
    </div>
  );
};

export default Calendar;
