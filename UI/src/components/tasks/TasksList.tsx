import React, { useMemo } from "react";
import { TaskGroupOption, TaskItem } from "./types";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { Avatar, Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { ViewMode } from "./TasksFiltersBar";
import TaskTooltip from "../TaskTooltip";
import { getTaskStatusTone, isDoneTaskStatus } from "../../utils/taskStatus";

interface TasksListProps {
  tasks: TaskItem[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick: (taskId: string) => void;
  pinnedTaskIds?: Set<string>;
  onTaskPinToggle?: (taskId: string, shouldPin: boolean) => void;
  canToggleStatus?: boolean;
  compactMode?: boolean;
  groupBy?: TaskGroupOption;
  viewMode?: ViewMode;
  pagination?: {
    total: number;
  } | null;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  selectedRowIds?: GridRowSelectionModel;
  onSelectedRowIdsChange?: (selection: GridRowSelectionModel) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-600";
    case "Medium":
      return "bg-orange-100 text-orange-600";
    case "Low":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
};

const getPriorityAccent = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-amber-500";
    case "Low":
      return "bg-blue-500";
    default:
      return "bg-slate-300";
  }
};

const getPriorityTone = (priority: string) => {
  switch (priority) {
    case "High":
      return {
        background: "rgba(254, 226, 226, 0.95)",
        border: "rgba(248, 113, 113, 0.28)",
        color: "rgb(185, 28, 28)",
      };
    case "Medium":
      return {
        background: "rgba(255, 237, 213, 0.95)",
        border: "rgba(251, 146, 60, 0.28)",
        color: "rgb(194, 65, 12)",
      };
    default:
      return {
        background: "rgba(219, 234, 254, 0.95)",
        border: "rgba(96, 165, 250, 0.28)",
        color: "rgb(29, 78, 216)",
      };
  }
};

const getStatusPillTone = (status: string) => {
  switch (status) {
    case "Done":
      return {
        dot: "rgb(34, 197, 94)",
        background: "rgba(220, 252, 231, 0.92)",
        border: "rgba(74, 222, 128, 0.35)",
        color: "rgb(21, 128, 61)",
      };
    case "In Progress":
      return {
        dot: "rgb(59, 130, 246)",
        background: "rgba(219, 234, 254, 0.92)",
        border: "rgba(96, 165, 250, 0.35)",
        color: "rgb(29, 78, 216)",
      };
    default:
      return {
        dot: "rgb(148, 163, 184)",
        background: "rgba(241, 245, 249, 0.96)",
        border: "rgba(203, 213, 225, 0.7)",
        color: "rgb(71, 85, 105)",
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { text: "No due date", isOverdue: false, isToday: false };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDate < today) {
    return {
      text: `Overdue - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      isOverdue: true,
    };
  }

  if (taskDate.getTime() === today.getTime()) {
    return { text: "Today", isToday: true };
  }

  return {
    text: `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    isOverdue: false,
  };
};

const dueBucket = (task: TaskItem) => {
  if (!task.due_date) return "No Due Date";
  const date = new Date(task.due_date);
  if (Number.isNaN(date.getTime())) return "No Due Date";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due Today";
  if (diffDays <= 3) return "Next 3 Days";
  return "Later";
};

const TasksList: React.FC<TasksListProps> = ({
  tasks,
  onTaskToggle,
  onTaskClick,
  pinnedTaskIds,
  onTaskPinToggle,
  canToggleStatus = true,
  compactMode = false,
  groupBy = "none",
  viewMode = "table",
  pagination = null,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  selectedRowIds = { type: "include", ids: new Set() },
  onSelectedRowIdsChange,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "TASK",
      flex: 1.2,
      minWidth: 210,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const isCompleted = params.row.status === "Done";
        return (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
            <input
              className="h-4 w-4 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer"
              type="checkbox"
              checked={isCompleted}
              disabled={!canToggleStatus}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTaskToggle(params.row.id, e.target.checked)}
            />
            <TaskTooltip task={params.row}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    color: isCompleted ? "rgb(100, 116, 139)" : "rgb(15, 23, 42)",
                    textDecoration: isCompleted ? "line-through" : "none",
                    opacity: isCompleted ? 0.6 : 1,
                    cursor: "pointer",
                  }}
                  onClick={() => onTaskClick(params.row.id)}
                >
                  {params.value}
                </Typography>
              </Box>
            </TaskTooltip>
          </Stack>
        );
      },
    },
    {
      field: "status",
      headerName: "STATUS",
      flex: 1,
      minWidth: 145,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const tone = getStatusPillTone(params.value);
        return (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: "999px",
              border: `1px solid ${tone.border}`,
              bgcolor: tone.background,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: tone.dot,
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: tone.color, fontSize: "0.72rem" }}
            >
              {params.value}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "priority",
      headerName: "PRIORITY",
      flex: 0.9,
      minWidth: 125,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const tone = getPriorityTone(params.value);
        return (
          <Chip
            label={params.value}
            size="small"
            variant="filled"
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              height: 24,
              borderRadius: "999px",
              border: `1px solid ${tone.border}`,
              "& .MuiChip-label": {
                px: 1.1,
              },
              bgcolor: tone.background,
              color: tone.color,
            }}
          />
        );
      },
    },
    {
      field: "assignee",
      headerName: "ASSIGNEE",
      flex: 0.9,
      minWidth: 125,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) {
          return (
            <Avatar
              sx={{
                bgcolor: "rgb(241, 245, 249)",
                color: "rgb(100, 116, 139)",
                fontWeight: 700,
                width: 32,
                height: 32,
                fontSize: "0.65rem",
                border: "1px solid rgb(226, 232, 240)",
              }}
            >
              ??
            </Avatar>
          );
        }
        return (
            <Avatar
              sx={{
                bgcolor: "rgba(59, 130, 246, 0.12)",
                color: "rgb(29, 78, 216)",
                fontWeight: 700,
                width: 32,
                height: 32,
                fontSize: "0.65rem",
                border: "1px solid rgba(96, 165, 250, 0.18)",
              }}
            >
              {getInitials(params.value.full_name)}
          </Avatar>
        );
      },
    },
    {
      field: "due_date",
      headerName: "DUE DATE",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) {
          return (
            <Typography variant="body2" sx={{ color: "rgb(148, 163, 184)", fontSize: "0.75rem" }}>
              No due date
            </Typography>
          );
        }
        const dateInfo = formatDate(params.value);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <span
              className={`material-symbols-outlined text-xs ${
                dateInfo.isOverdue
                  ? "text-red-500"
                  : dateInfo.isToday
                    ? "text-blue-600"
                    : "text-slate-400"
              }`}
            >
              calendar_today
            </span>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                fontWeight: dateInfo.isOverdue || dateInfo.isToday ? 700 : 500,
                color: dateInfo.isOverdue
                  ? "rgb(239, 68, 68)"
                  : dateInfo.isToday
                    ? "rgb(37, 99, 235)"
                    : "rgb(100, 116, 139)",
              }}
            >
              {dateInfo.text}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isPinned = Boolean(pinnedTaskIds?.has(params.row.id));
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onTaskPinToggle) {
                onTaskPinToggle(params.row.id, !isPinned);
              }
            }}
            sx={{
              color: isPinned ? "rgb(245, 158, 11)" : "rgb(203, 213, 225)",
              borderRadius: "10px",
              "&:hover": {
                backgroundColor: "rgba(248, 250, 252, 0.95)",
                color: isPinned ? "rgb(217, 119, 6)" : "rgb(100, 116, 139)",
              },
            }}
          >
            <span className="material-symbols-outlined text-sm">
              {isPinned ? "keep" : "keep_off"}
            </span>
          </IconButton>
        );
      },
    },
  ];

  const tableRows = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      due_date: task.due_date,
    }));
  }, [tasks]);

  const groupedEntries: Array<{ label: string; items: TaskItem[] }> = (() => {
    if (groupBy === "none") return [{ label: "", items: tasks }];

    const groups = new Map<string, TaskItem[]>();
    for (const task of tasks) {
      let key = "Other";
      if (groupBy === "status") key = task.status;
      if (groupBy === "priority") key = task.priority;
      if (groupBy === "due") key = dueBucket(task);
      const existing = groups.get(key) || [];
      existing.push(task);
      groups.set(key, existing);
    }

    const statusOrder = ["To Do", "In Progress", "Ready for QA", "In QA", "Blocked", "Done"];
    const priorityOrder = ["High", "Medium", "Low"];
    const dueOrder = ["Overdue", "Due Today", "Next 3 Days", "Later", "No Due Date"];

    const entries = Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));

    if (groupBy === "status") {
      return entries.sort(
        (a, b) => statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label),
      );
    }
    if (groupBy === "priority") {
      return entries.sort(
        (a, b) =>
          priorityOrder.indexOf(a.label) - priorityOrder.indexOf(b.label),
      );
    }
    if (groupBy === "due") {
      return entries.sort((a, b) => dueOrder.indexOf(a.label) - dueOrder.indexOf(b.label));
    }
    return entries;
  })();

  // Grid layout for desktop, list for mobile
  const renderTaskCard = (task: TaskItem) => {
    const dateInfo = task.due_date ? formatDate(task.due_date) : null;
    const isCompleted = isDoneTaskStatus(task.status);
    const isPinned = Boolean(pinnedTaskIds?.has(task.id));

    return (
      <TaskTooltip key={task.id} task={task}>
        <div
          className="relative overflow-hidden group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => onTaskClick(task.id)}
        >
        <span className={`absolute inset-x-0 top-0 h-1 ${getPriorityAccent(task.priority)}`} />
        
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <input
              className="h-4 w-4 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer mt-0.5"
              type="checkbox"
              checked={isCompleted}
              disabled={!canToggleStatus}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTaskToggle(task.id, e.target.checked)}
            />
            <button
              className={`p-0.5 transition-colors ${
                isPinned
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-slate-300 hover:text-slate-500"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTaskPinToggle) {
                  onTaskPinToggle(task.id, !isPinned);
                }
              }}
            >
              <span className="material-symbols-outlined text-sm">
                {isPinned ? "keep" : "keep_off"}
              </span>
            </button>
          </div>

          <h3 className={`text-sm font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors ${
            isCompleted ? "line-through opacity-60" : ""
          }`}>
            {task.title}
          </h3>

          <div className="flex flex-col gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 w-fit">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                getTaskStatusTone(task.status).dot
              }`} />
              {task.status}
            </span>
            {dateInfo && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`material-symbols-outlined text-sm ${
                  dateInfo.isOverdue
                    ? "text-red-500"
                    : dateInfo.isToday
                      ? "text-blue-600"
                      : ""
                }`}>
                  calendar_today
                </span>
                <span className={dateInfo.isOverdue
                  ? "text-red-500 font-medium"
                  : dateInfo.isToday
                    ? "text-blue-600 font-medium"
                    : ""
                }>
                  {dateInfo.text}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {task.assignee ? (
              <div className="size-6 rounded-full border border-white bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-700">
                {task.assignee.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            ) : (
              <div className="size-6 rounded-full border border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                ??
              </div>
            )}
            <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0)}
            </div>
          </div>
        </div>
        </div>
      </TaskTooltip>
    );
  };

  const renderTaskRow = (task: TaskItem) => {
    const dateInfo = task.due_date ? formatDate(task.due_date) : null;
    const isCompleted = isDoneTaskStatus(task.status);
    const isPinned = Boolean(pinnedTaskIds?.has(task.id));

    return (
      <div
        key={task.id}
        className={`relative overflow-hidden group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white px-4 sm:px-5 ${
          compactMode ? "py-3" : "py-4"
        } rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all cursor-pointer`}
        onClick={() => onTaskClick(task.id)}
      >
        <span
          className={`absolute inset-y-0 left-0 w-1.5 ${getPriorityAccent(task.priority)}`}
        />
        <div className="flex size-6 items-center justify-center shrink-0">
          <input
            className="h-5 w-5 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer"
            type="checkbox"
            checked={isCompleted}
            disabled={!canToggleStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onTaskToggle(task.id, e.target.checked)}
          />
        </div>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <p
              className={`text-slate-900 ${
                compactMode ? "text-sm" : "text-base"
              } font-semibold leading-normal group-hover:text-blue-700 transition-colors truncate ${
                isCompleted ? "line-through opacity-60" : ""
              }`}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    getTaskStatusTone(task.status).dot
                  }`}
                />
                {task.status}
              </span>
              {dateInfo && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      dateInfo.isOverdue
                        ? "text-red-500"
                        : dateInfo.isToday
                          ? "text-blue-600"
                          : ""
                    }`}
                  >
                    calendar_today
                  </span>
                  <span
                    className={
                      dateInfo.isOverdue
                        ? "text-red-500 font-medium"
                        : dateInfo.isToday
                          ? "text-blue-600 font-medium"
                          : ""
                    }
                  >
                    {dateInfo.text}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
            {task.assignee ? (
              <div className="size-8 rounded-full border-2 border-white bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-700">
                {task.assignee.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            ) : (
              <div className="size-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                ??
              </div>
            )}
            <div
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </div>
            <button
              className={`p-1 transition-colors ${
                isPinned
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-slate-300 hover:text-slate-500"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTaskPinToggle) {
                  onTaskPinToggle(task.id, !isPinned);
                }
              }}
            >
              <span className="material-symbols-outlined">
                {isPinned ? "keep" : "keep_off"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Desktop Views */}
      <div className="hidden lg:block">
        {viewMode === "table" ? (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)]">
            <DataGrid
              rows={tableRows}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              autoHeight
              checkboxSelection
              pagination
              paginationMode="server"
              rowCount={pagination?.total ?? tableRows.length}
              rowSelectionModel={selectedRowIds}
              onRowSelectionModelChange={onSelectedRowIdsChange}
              paginationModel={{
                page: currentPage - 1,
                pageSize: itemsPerPage,
              }}
              onPaginationModelChange={(model) => {
                if (model.pageSize !== itemsPerPage) {
                  onItemsPerPageChange?.(model.pageSize);
                }
                if (model.page + 1 !== currentPage) {
                  onPageChange?.(model.page + 1);
                }
              }}
              disableRowSelectionOnClick
              rowHeight={62}
              columnHeaderHeight={52}
              sx={{
                border: 0,
                background:
                  "linear-gradient(180deg, rgba(248,250,252,0.45) 0%, rgba(255,255,255,1) 16%)",
                "& .MuiDataGrid-main": {
                  backgroundColor: "transparent",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(248, 250, 252, 0.92)",
                  color: "rgb(51, 65, 85)",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  borderBottom: "1px solid rgb(226, 232, 240)",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid rgb(241, 245, 249)",
                  borderRight: "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                },
                "& .MuiDataGrid-cellCheckbox, & .MuiDataGrid-columnHeaderCheckbox": {
                  width: 52,
                  minWidth: "52px !important",
                  maxWidth: "52px !important",
                },
                "& .MuiDataGrid-row": {
                  minHeight: "62px !important",
                  maxHeight: "62px !important",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(248, 250, 252, 0.78)",
                  },
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "rgba(239, 246, 255, 0.8)",
                },
                "& .MuiDataGrid-row.Mui-selected:hover": {
                  backgroundColor: "rgba(239, 246, 255, 0.96)",
                },
                "& .MuiDataGrid-columnSeparator": {
                  display: "none",
                },
                "& .MuiDataGrid-footerContainer": {
                  minHeight: 56,
                  borderTop: "1px solid rgb(226, 232, 240)",
                  backgroundColor: "rgba(248, 250, 252, 0.72)",
                },
                "& .MuiCheckbox-root.Mui-checked": {
                  color: "rgb(37, 99, 235)",
                },
                "& .MuiTablePagination-root": {
                  color: "rgb(71, 85, 105)",
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.78rem",
                  fontWeight: 600,
                },
                "& .MuiIconButton-root": {
                  borderRadius: "10px",
                },
              }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {groupedEntries.map((group) => (
              <div key={group.label || "all"} className="space-y-3">
                {group.label && (
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {group.label}
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {group.items.length}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {group.items.map(renderTaskCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile List Layout */}
      <div className="lg:hidden">
        {groupedEntries.map((group) => (
          <div key={group.label || "all"} className="space-y-3">
            {group.label && (
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {group.label}
                </h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {group.items.length}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {group.items.map(renderTaskRow)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksList;
