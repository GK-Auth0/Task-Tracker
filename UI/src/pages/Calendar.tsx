import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { tasksAPI, usersAPI } from "../services/dashboard";

interface CalendarTask {
  id: string;
  title: string;
  due_date?: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  color: string;
}

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

  useEffect(() => {
    fetchTasks();
    if (calendarType === "team") {
      fetchTeamMembers();
    }
  }, [user, calendarType]);

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

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900">
                {calendarType === "personal" ? "My Calendar" : "Team Calendar"}
              </h2>
              <p className="text-sm text-slate-500">
                {calendarType === "personal"
                  ? `Personal schedule for ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `Team schedule for ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setCalendarType("personal")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                  calendarType === "personal"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setCalendarType("team")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                  calendarType === "team"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Team
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-1 border-r border-slate-200 pr-3 mr-3">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-900"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth("next")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                  viewMode === "week"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                  viewMode === "day"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className="flex-1 grid grid-cols-7 divide-x divide-y divide-slate-200"
            style={{ gridAutoRows: "minmax(100px, 1fr)" }}
          >
            {days.map((day, index) => {
              const dayTasks = getTasksForDate(day.date);
              const isCurrentDay = isToday(day.date);

              return (
                <div
                  key={index}
                  className={`p-2 ${
                    day.isCurrentMonth
                      ? isCurrentDay
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-600"
                        : "bg-white"
                      : "bg-slate-50"
                  }`}
                >
                  <div
                    className={`text-right text-sm font-bold ${
                      day.isCurrentMonth
                        ? isCurrentDay
                          ? "text-blue-600"
                          : "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {isCurrentDay ? (
                      <span className="bg-blue-600 text-white size-6 inline-flex items-center justify-center rounded-full -mr-1">
                        {day.date.getDate()}
                      </span>
                    ) : (
                      day.date.getDate()
                    )}
                  </div>

                  {dayTasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayTasks.slice(0, 2).map((task, taskIndex) => {
                        const taskColor = getTaskColor(task);
                        const colorClasses = {
                          red: "bg-red-100 text-red-700 border-red-500",
                          amber: "bg-amber-100 text-amber-700 border-amber-500",
                          green: "bg-green-100 text-green-700 border-green-500",
                          blue: "bg-blue-100 text-blue-700 border-blue-500",
                          emerald:
                            "bg-emerald-100 text-emerald-700 border-emerald-500",
                          indigo:
                            "bg-indigo-100 text-indigo-700 border-indigo-500",
                          rose: "bg-rose-100 text-rose-700 border-rose-500",
                          purple:
                            "bg-purple-100 text-purple-700 border-purple-500",
                          orange:
                            "bg-orange-100 text-orange-700 border-orange-500",
                        };

                        return (
                          <div
                            key={taskIndex}
                            className={`${colorClasses[taskColor as keyof typeof colorClasses] || colorClasses.blue} text-[11px] px-2 py-1 rounded border-l-2 font-medium truncate cursor-pointer hover:opacity-80`}
                            title={
                              calendarType === "team" && task.assignee
                                ? `${task.assignee.full_name}: ${task.title}`
                                : task.title
                            }
                          >
                            {calendarType === "team" && task.assignee
                              ? `${task.assignee.full_name.split(" ")[0]}: ${task.title}`
                              : task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {calendarType === "team" &&
          (() => {
            // Get unique assignees from visible tasks
            const visibleAssignees = tasks
              .filter((task) => task.assignee && task.due_date)
              .map((task) => task.assignee!)
              .filter(
                (assignee, index, arr) =>
                  arr.findIndex((a) => a.id === assignee.id) === index,
              );

            const membersWithTasks = visibleAssignees.map((assignee) => {
              const member = teamMembers.find((m) => m.id === assignee.id);
              return member
                ? { ...assignee, color: member.color }
                : { ...assignee, color: "blue" };
            });

            return membersWithTasks.length > 0 ? (
              <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Team Legend:
                </span>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  {membersWithTasks.map((member) => {
                    const colorClasses = {
                      emerald: "bg-emerald-500",
                      indigo: "bg-indigo-500",
                      rose: "bg-rose-500",
                      amber: "bg-amber-500",
                      purple: "bg-purple-500",
                      green: "bg-green-500",
                      blue: "bg-blue-500",
                      orange: "bg-orange-500",
                    };
                    return (
                      <div key={member.id} className="flex items-center gap-2">
                        <span
                          className={`size-3 rounded-sm ${colorClasses[member.color as keyof typeof colorClasses] || "bg-blue-500"}`}
                        ></span>
                        <span className="text-sm font-medium text-slate-900">
                          {member.full_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}
      </div>

      <aside className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Tasks</h3>
          <div className="relative">
            <input
              className="w-full bg-white border-slate-200 rounded-lg text-sm pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-600/20 shadow-sm"
              placeholder="I need to..."
              type="text"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming Deadlines
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              Personal
            </span>
          </div>

          <div className="space-y-4">
            {tasks
              .filter(
                (task) => task.due_date && new Date(task.due_date) > new Date(),
              )
              .slice(0, 3)
              .map((task, index) => {
                const dueDate = new Date(task.due_date!);
                const daysUntilDue = Math.ceil(
                  (dueDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                return (
                  <div key={index} className="group cursor-pointer">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                      <div className="size-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600">
                          {dueDate
                            .toLocaleDateString("en-US", { month: "short" })
                            .toUpperCase()}
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {dueDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            schedule
                          </span>
                          Due in {daysUntilDue} day
                          {daysUntilDue !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {task.project.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Calendar;
