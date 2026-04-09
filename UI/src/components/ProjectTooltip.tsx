import React from "react";
import { Tooltip, TooltipProps } from "@mui/material";

interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  member_count?: number;
  progress?: number;
}

interface ProjectTooltipProps extends Omit<TooltipProps, 'title'> {
  project: ProjectItem;
  children: React.ReactElement;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: "numeric"
  });
};

const ProjectTooltip: React.FC<ProjectTooltipProps> = ({ 
  project, 
  children, 
  placement = "top",
  arrow = true,
  ...tooltipProps 
}) => {
  const tooltipContent = (
    <div className="p-2 max-w-xs">
      <div className="font-semibold text-sm mb-1 text-white">{project.name}</div>
      {project.description && (
        <div className="text-xs text-gray-200 mb-2 line-clamp-3">{project.description}</div>
      )}
      <div className="space-y-1 text-xs text-gray-200">
        <div><span className="font-medium text-white">Status:</span> {project.status}</div>
        <div><span className="font-medium text-white">Priority:</span> {project.priority}</div>
        {project.owner && (
          <div><span className="font-medium text-white">Owner:</span> {project.owner.name}</div>
        )}
        {project.member_count !== undefined && (
          <div><span className="font-medium text-white">Members:</span> {project.member_count}</div>
        )}
        {project.progress !== undefined && (
          <div><span className="font-medium text-white">Progress:</span> {project.progress}%</div>
        )}
        {project.startDate && (
          <div><span className="font-medium text-white">Start:</span> {formatDate(project.startDate)}</div>
        )}
        {project.endDate && (
          <div><span className="font-medium text-white">End:</span> {formatDate(project.endDate)}</div>
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

export default ProjectTooltip;