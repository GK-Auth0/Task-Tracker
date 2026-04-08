import React from "react";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import TasksEmptyState from "./TasksEmptyState";
import TasksList from "./TasksList";
import TasksPagination from "./TasksPagination";
import { ViewMode } from "./TasksFiltersBar";
import {
  TaskGroupOption,
  TaskItem,
  TasksPagination as TasksPageData,
} from "./types";

interface TasksOverviewTabProps {
  tasks: TaskItem[];
  canCreateTask: boolean;
  pinnedTaskIds: Set<string>;
  groupBy: TaskGroupOption;
  compactMode: boolean;
  viewMode?: ViewMode;
  pagination: TasksPageData | null;
  currentPage: number;
  itemsPerPage: number;
  onCreateTask: () => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick: (taskId: string) => void;
  onTaskPinToggle: (taskId: string, shouldPin: boolean) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  selectedRowIds: GridRowSelectionModel;
  onSelectedRowIdsChange: (selection: GridRowSelectionModel) => void;
}

const TasksOverviewTab: React.FC<TasksOverviewTabProps> = ({
  tasks,
  canCreateTask,
  pinnedTaskIds,
  groupBy,
  compactMode,
  viewMode = "table",
  pagination,
  currentPage,
  itemsPerPage,
  onCreateTask,
  onTaskToggle,
  onTaskClick,
  onTaskPinToggle,
  onPageChange,
  onItemsPerPageChange,
  selectedRowIds,
  onSelectedRowIdsChange,
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
          compactMode={compactMode}
          groupBy={groupBy}
          viewMode={viewMode}
          pagination={pagination}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          selectedRowIds={selectedRowIds}
          onSelectedRowIdsChange={onSelectedRowIdsChange}
        />
      ) : (
        <TasksEmptyState onCreateTask={onCreateTask} canCreate={canCreateTask} />
      )}

      <div className={viewMode === "table" ? "lg:hidden" : ""}>
        <TasksPagination
          pagination={pagination}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};

export default TasksOverviewTab;
