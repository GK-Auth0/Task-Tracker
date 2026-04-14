import React, { useMemo } from "react";
import { Project } from "../../types/project";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Avatar, Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { ViewMode } from "./ProjectsFilters";
import ProjectTooltip from "../ProjectTooltip";
import { getRichTextPreview } from "../../utils/richText";
import ProjectCard from "../ProjectCard";

interface ProjectsListProps {
  projects: Project[];
  onCreate: () => void;
  pinnedProjectIds?: Set<string>;
  onProjectPinToggle?: (projectId: string, shouldPin: boolean) => void;
  canCreate?: boolean;
  viewMode?: ViewMode;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "rgb(34, 197, 94)";
    case "planning":
      return "rgb(59, 130, 246)";
    case "on_hold":
      return "rgb(234, 179, 8)";
    case "completed":
      return "rgb(34, 197, 94)";
    case "cancelled":
      return "rgb(239, 68, 68)";
    default:
      return "rgb(148, 163, 184)";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return { bg: "rgb(254, 226, 226)", color: "rgb(220, 38, 38)" };
    case "medium":
      return { bg: "rgb(255, 237, 213)", color: "rgb(234, 88, 12)" };
    case "low":
      return { bg: "rgb(219, 234, 254)", color: "rgb(37, 99, 235)" };
    default:
      return { bg: "rgb(241, 245, 249)", color: "rgb(100, 116, 139)" };
  }
};

const formatStatus = (status: string) => {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  onCreate,
  pinnedProjectIds,
  onProjectPinToggle,
  canCreate = true,
  viewMode = "grid",
}) => {
  const getInitials = (name: string | undefined | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "PROJECT",
      flex: 1,
      minWidth: 300,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const descriptionPreview = getRichTextPreview(params.row.description || "", 100);
        return (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
            <ProjectTooltip project={params.row}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    color: "rgb(15, 23, 42)",
                    cursor: "pointer",
                  }}
                  onClick={() => window.location.href = `/project/${params.row.id}`}
                >
                  {params.value}
                </Typography>
                {descriptionPreview && (
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: "rgb(100, 116, 139)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {descriptionPreview}
                  </Typography>
                )}
              </Box>
            </ProjectTooltip>
          </Stack>
        );
      },
    },
    {
      field: "status",
      headerName: "STATUS",
      width: 140,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const statusColor = getStatusColor(params.value);
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: statusColor,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500, color: "rgb(15, 23, 42)", fontSize: "0.75rem" }}>
              {formatStatus(params.value)}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "priority",
      headerName: "PRIORITY",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const priorityColor = getPriorityColor(params.value);
        return (
          <Chip
            label={params.value.charAt(0).toUpperCase()}
            size="small"
            variant="filled"
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              height: 20,
              minWidth: 20,
              "& .MuiChip-label": {
                px: 0.5,
              },
              bgcolor: priorityColor.bg,
              color: priorityColor.color,
            }}
          />
        );
      },
    },
    {
      field: "owner",
      headerName: "OWNER",
      width: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) {
          return (
            <Avatar
              sx={{
                bgcolor: "rgb(226, 232, 240)",
                color: "rgb(100, 116, 139)",
                fontWeight: 700,
                width: 28,
                height: 28,
                fontSize: "0.65rem",
              }}
            >
              ??
            </Avatar>
          );
        }
        return (
          <Avatar
            sx={{
              bgcolor: "rgba(37, 99, 235, 0.1)",
              color: "rgb(37, 99, 235)",
              fontWeight: 700,
              width: 28,
              height: 28,
              fontSize: "0.65rem",
            }}
          >
            {getInitials(params.value.full_name)}
          </Avatar>
        );
      },
    },
    {
      field: "member_count",
      headerName: "MEMBERS",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "rgb(100, 116, 139)" }}>
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: "progress",
      headerName: "PROGRESS",
      width: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: "rgb(226, 232, 240)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${params.value || 0}%`,
                height: "100%",
                bgcolor: "rgb(34, 197, 94)",
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontSize: "0.7rem", color: "rgb(100, 116, 139)" }}>
            {params.value || 0}%
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isPinned = Boolean(pinnedProjectIds?.has(params.row.id));
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onProjectPinToggle) {
                onProjectPinToggle(params.row.id, !isPinned);
              }
            }}
            sx={{
              color: isPinned ? "rgb(245, 158, 11)" : "rgb(203, 213, 225)",
              "&:hover": {
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
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      owner: project.owner,
      member_count: project.member_count,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
    }));
  }, [projects]);

  return (
    <div className="space-y-5">
      {/* Desktop Views */}
      <div className="hidden lg:block">
        {viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <DataGrid
              rows={tableRows}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              disableRowSelectionOnClick
              rowHeight={48}
              columnHeaderHeight={40}
              sx={{
                border: 0,
                height: 600,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(248, 250, 252, 0.8)",
                  color: "rgb(15, 23, 42)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  borderBottom: "1px solid rgb(226, 232, 240)",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid rgb(241, 245, 249)",
                  borderRight: "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                },
                "& .MuiDataGrid-row": {
                  minHeight: "48px !important",
                  maxHeight: "48px !important",
                  "&:hover": {
                    backgroundColor: "rgba(248, 250, 252, 0.8)",
                  },
                },
                "& .MuiDataGrid-columnSeparator": {
                  display: "none",
                },
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectTooltip key={project.id} project={project}>
                <div>
                  <ProjectCard
                    project={project}
                    isPinned={Boolean(pinnedProjectIds?.has(project.id))}
                    onTogglePin={onProjectPinToggle}
                  />
                </div>
              </ProjectTooltip>
            ))}

            {canCreate && (
              <button
                onClick={onCreate}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 group"
              >
                <span className="material-symbols-outlined text-4xl">add_circle</span>
                <span className="text-sm font-bold">Create New Project</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Grid Layout */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isPinned={Boolean(pinnedProjectIds?.has(project.id))}
              onTogglePin={onProjectPinToggle}
            />
          ))}

          {canCreate && (
            <button
              onClick={onCreate}
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 group"
            >
              <span className="material-symbols-outlined text-4xl">add_circle</span>
              <span className="text-sm font-bold">Create New Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsList;
