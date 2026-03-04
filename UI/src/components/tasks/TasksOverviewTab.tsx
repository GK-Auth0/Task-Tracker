import React from "react";
import TasksEmptyState from "./TasksEmptyState";
import TasksList from "./TasksList";
import TasksPagination from "./TasksPagination";
import { TaskItem, TasksPagination as TasksPageData } from "./types";

interface TasksOverviewTabProps {
  tasks: TaskItem[];
  canCreateTask: boolean;
  pinnedTaskIds: Set<string>;
  pagination: TasksPageData | null;
  currentPage: number;
  itemsPerPage: number;
  onCreateTask: () => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick: (taskId: string) => void;
  onTaskPinToggle: (taskId: string, shouldPin: boolean) => void;
  onPageChange: (page: number) => void;
}

const TasksOverviewTab: React.FC<TasksOverviewTabProps> = ({
  tasks,
  canCreateTask,
  pinnedTaskIds,
  pagination,
  currentPage,
  itemsPerPage,
  onCreateTask,
  onTaskToggle,
  onTaskClick,
  onTaskPinToggle,
  onPageChange,
}) => {
  return (
    <>
      {tasks.length > 0 ? (
        <TasksList
          tasks={tasks}
          onTaskToggle={onTaskToggle}
          onTaskClick={onTaskClick}
          pinnedTaskIds={pinnedTaskIds}
          onTaskPinToggle={onTaskPinToggle}
          canToggleStatus={canCreateTask}
        />
      ) : (
        <TasksEmptyState onCreateTask={onCreateTask} canCreate={canCreateTask} />
      )}

      <TasksPagination
        pagination={pagination}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default TasksOverviewTab;
