import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { tasksAPI, usersAPI } from "../services/dashboard";
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
    <div className="flex flex-1 flex-col xl:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
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
