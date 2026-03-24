import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { tasksAPI, usersAPI } from "../services/dashboard";
import { aiAssistantAPI, AiProjectInsights } from "../services/aiAssistant";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarMonthGrid from "../components/calendar/CalendarMonthGrid";
import CalendarTeamLegend from "../components/calendar/CalendarTeamLegend";
import CalendarSidebar from "../components/calendar/CalendarSidebar";
import { CalendarTask, TeamMember } from "../components/calendar/types";

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [calendarType, setCalendarType] = useState<"personal" | "team">(
    "personal",
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [aiInsights, setAiInsights] = useState<AiProjectInsights | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState("");

  useEffect(() => {
    fetchTasks();
    if (calendarType === "team") {
      fetchTeamMembers();
    }
  }, [user, calendarType]);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchCalendarInsights();
    } else {
      setAiInsights(null);
      setAiInsightsError("");
    }
  }, [tasks]);

  const fetchTeamMembers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      if (response.success) {
        const colors = [
          "emerald",
          "indigo",
          "rose",
          "amber",
          "purple",
          "green",
          "blue",
          "orange",
        ];
        const membersWithColors = response.data.map((member, index) => ({
          ...member,
          color: colors[index % colors.length],
        }));
        setTeamMembers(membersWithColors);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await tasksAPI.getTasks({ limit: 100 });
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const membersWithTasks = visibleAssignees.map((assignee) => {
    const member = teamMembers.find((m) => m.id === assignee.id);
    return member ? { ...assignee, color: member.color } : { ...assignee, color: "blue" };
  });

  return (
    <div className="flex min-h-0 flex-col xl:flex-row">
      <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10">
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

        <section className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                AI Calendar Insights
              </p>
              {aiInsights && (
                <p className="text-xs text-indigo-900/80 mt-1">
                  {aiInsights.summary}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={fetchCalendarInsights}
              disabled={aiInsightsLoading || tasks.length === 0}
              className="h-9 px-4 rounded-lg bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 disabled:opacity-50"
            >
              {aiInsightsLoading ? "Analyzing..." : "Refresh AI"}
            </button>
          </div>

          {aiInsightsError && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              {aiInsightsError}
            </p>
          )}

          {aiInsights && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <ul className="mt-1 space-y-1">
                  {aiInsights.signals.slice(0, 3).map((signal) => (
                    <li key={signal} className="text-sm text-slate-700">
                      • {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <CalendarMonthGrid
          days={days}
          loading={loading}
          calendarType={calendarType}
          onGetTasksForDate={getTasksForDate}
          onGetTaskColor={getTaskColor}
          onIsToday={isToday}
        />

        {calendarType === "team" && <CalendarTeamLegend members={membersWithTasks} />}
      </div>

      <CalendarSidebar tasks={tasks} loading={loading} calendarType={calendarType} />
    </div>
  );
};

export default Calendar;
