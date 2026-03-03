import React from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../types/project";

interface ProjectCardProps {
  project: Project;
  isPinned?: boolean;
  onTogglePin?: (projectId: string, shouldPin: boolean) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isPinned = false,
  onTogglePin,
}) => {
  const navigate = useNavigate();
  const safeStatus = String(project?.status || "planning").toLowerCase();
  const safeName = String(project?.name || "Untitled Project");
  const ownerName =
    String((project as any)?.owner?.name || (project as any)?.owner?.full_name || "").trim() ||
    "Owner";
  const ownerAvatar =
    String((project as any)?.owner?.avatar || (project as any)?.owner?.avatar_url || "").trim() ||
    "";
  const members = Array.isArray((project as any)?.members)
    ? (project as any).members
    : [];

  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600";
      case "active":
        return "text-blue-600";
      case "on_hold":
        return "text-amber-600";
      case "planning":
        return "text-slate-500";
      default:
        return "text-slate-500";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500";
      case "active":
        return "bg-blue-600";
      case "on_hold":
        return "bg-amber-500";
      case "planning":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const progress = project.progress || 0;

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${getStatusColor(safeStatus)}`}
          >
            {safeStatus.replace("_", " ")}
          </span>
          <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">
            {safeName}
          </h3>
          {project.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <span
            className={`material-symbols-outlined ${
              isPinned ? "text-amber-500" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              if (onTogglePin) {
                onTogglePin(project.id, !isPinned);
              }
            }}
          >
            {isPinned ? "keep" : "keep_off"}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Task Completion</span>
          <span className="font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${getProgressColor(safeStatus)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
        <div className="flex -space-x-2">
          {project.owner && (
            <div
              className="size-8 rounded-full border-2 border-white bg-slate-200 bg-cover"
              title={ownerName}
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          {members.slice(0, 3).map((member: any, index: number) => {
            const memberName =
              String(member?.user?.name || member?.user?.full_name || "").trim() ||
              "Member";
            const memberAvatar =
              String(member?.user?.avatar || member?.user?.avatar_url || "").trim() ||
              "";
            return (
              <div
                key={member?.id || member?.user?.id || `${project.id}-member-${index}`}
                className="size-8 rounded-full border-2 border-white bg-slate-200 bg-cover"
                title={memberName}
              >
                {memberAvatar ? (
                  <img
                    src={memberAvatar}
                    alt={memberName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-400 flex items-center justify-center text-white text-xs font-bold">
                    {memberName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
          {members.length > 3 && (
            <div className="size-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
              +{members.length - 3}
            </div>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Updated {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
