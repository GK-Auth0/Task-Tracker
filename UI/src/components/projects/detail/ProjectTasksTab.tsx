import TaskTrends from "./TaskTrends";
import type { Task } from "../../../types/task";
import { useMemo } from "react";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import TasksList from "../../tasks/TasksList";
import type { TaskItem } from "../../tasks/types";

interface ProjectTasksTabProps {
  tasks: Task[];
  tasksLoading: boolean;
  tabError: string;
  onOpenTask: (taskId: string) => void;
  selectedRowIds: GridRowSelectionModel;
  onSelectedRowIdsChange: (selection: GridRowSelectionModel) => void;
}

export default function ProjectTasksTab({
  tasks,
  tasksLoading,
  tabError,
  onOpenTask,
  selectedRowIds,
  onSelectedRowIdsChange,
}: ProjectTasksTabProps) {
  const tableTasks = useMemo<TaskItem[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority:
          task.priority === "high"
            ? "High"
            : task.priority === "low"
              ? "Low"
              : "Medium",
        due_date: task.dueDate,
      })),
    [tasks],
  );

  return (
    <div className="space-y-4">
      <TaskTrends tasks={tasks} />
      {tasksLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
          Loading tasks...
        </div>
      )}
      {tabError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {tabError}
        </div>
      )}
      <TasksList
        tasks={tableTasks}
        onTaskToggle={() => undefined}
        onTaskClick={onOpenTask}
        canToggleStatus={false}
        compactMode={false}
        groupBy="none"
        viewMode="table"
        pagination={null}
        currentPage={1}
        itemsPerPage={10}
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
      />
    </div>
  );
}
