import React from "react";
import { Tooltip, TooltipProps } from "@mui/material";
import { getFullName } from "../utils/user";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TaskTooltipProps extends Omit<TooltipProps, 'title'> {
  task: TaskItem;
  children: React.ReactElement;
}

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

const TaskTooltip: React.FC<TaskTooltipProps> = ({ 
  task, 
  children, 
  placement = "top",
  arrow = true,
  ...tooltipProps 
}) => {
  const dateInfo = task.due_date ? formatDate(task.due_date) : null;

  const tooltipContent = (
    <div className="p-2 max-w-xs">
      <div className="font-semibold text-sm mb-1 text-white">{task.title}</div>
      {task.description && (
        <div className="text-xs text-gray-200 mb-2 line-clamp-3">{task.description}</div>
      )}
      <div className="space-y-1 text-xs text-gray-200">
        <div><span className="font-medium text-white">Status:</span> {task.status}</div>
        <div><span className="font-medium text-white">Priority:</span> {task.priority}</div>
        {task.assignee && (
          <div><span className="font-medium text-white">Assignee:</span> {getFullName(task.assignee)}</div>
        )}
        {dateInfo && (
          <div><span className="font-medium text-white">Due:</span> {dateInfo.text}</div>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip 
      title={tooltipContent} 
      placement={placement}
      arrow={arrow}
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  );
};

export default TaskTooltip;