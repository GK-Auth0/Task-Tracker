import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { defectSectionLinks } from "../data/testManagement";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { defectsAPI } from "../services/defects";
import type { Defect } from "../types/defect";

const statusToneMap: Record<Defect["status"], { bg: string; border: string; color: string }> = {
  Open: {
    bg: "rgba(254, 243, 199, 0.9)",
    border: "rgba(245, 158, 11, 0.28)",
    color: "rgb(180, 83, 9)",
  },
  Approved: {
    bg: "rgba(220, 252, 231, 0.92)",
    border: "rgba(74, 222, 128, 0.32)",
    color: "rgb(21, 128, 61)",
  },
  Rejected: {
    bg: "rgba(254, 226, 226, 0.92)",
    border: "rgba(248, 113, 113, 0.32)",
    color: "rgb(185, 28, 28)",
  },
  "In Progress": {
    bg: "rgba(219, 234, 254, 0.92)",
    border: "rgba(96, 165, 250, 0.32)",
    color: "rgb(29, 78, 216)",
  },
  Resolved: {
    bg: "rgba(241, 245, 249, 0.95)",
    border: "rgba(203, 213, 225, 0.8)",
    color: "rgb(71, 85, 105)",
  },
};

const priorityToneMap: Record<
  Defect["priority"],
  { bg: string; border: string; color: string }
> = {
  Critical: {
    bg: "rgba(254, 226, 226, 0.96)",
    border: "rgba(239, 68, 68, 0.28)",
    color: "rgb(185, 28, 28)",
  },
  High: {
    bg: "rgba(255, 237, 213, 0.96)",
    border: "rgba(249, 115, 22, 0.28)",
    color: "rgb(194, 65, 12)",
  },
  Medium: {
    bg: "rgba(254, 249, 195, 0.96)",
    border: "rgba(234, 179, 8, 0.28)",
    color: "rgb(161, 98, 7)",
  },
  Low: {
    bg: "rgba(219, 234, 254, 0.96)",
    border: "rgba(96, 165, 250, 0.28)",
    color: "rgb(29, 78, 216)",
  },
};

const severityToneMap: Record<
  Defect["severity"],
  { bg: string; border: string; color: string }
> = {
  Critical: {
    bg: "rgba(255, 228, 230, 0.96)",
    border: "rgba(244, 63, 94, 0.28)",
    color: "rgb(190, 24, 93)",
  },
  High: {
    bg: "rgba(254, 242, 242, 0.96)",
    border: "rgba(248, 113, 113, 0.28)",
    color: "rgb(185, 28, 28)",
  },
  Medium: {
    bg: "rgba(255, 247, 237, 0.96)",
    border: "rgba(251, 146, 60, 0.28)",
    color: "rgb(194, 65, 12)",
  },
  Low: {
    bg: "rgba(236, 253, 245, 0.96)",
    border: "rgba(52, 211, 153, 0.28)",
    color: "rgb(5, 150, 105)",
  },
};

const formatShortDate = (value?: string | null) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TestDefects() {
  const navigate = useNavigate();
  const location = useLocation();
  const createdDefectId = location.state?.createdDefectId as string | undefined;
  const createdDefectReferenceCode = location.state?.createdDefectReferenceCode as
    | string
    | undefined;
  const createdDefectTitle = location.state?.createdDefectTitle as string | undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sprintFilter, setSprintFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, projectFilter, sprintFilter, taskFilter, statusFilter]);

  const {
    data: defectsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery(
    [
      "defects-page-data",
      {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        project_id: projectFilter,
        task_id: taskFilter,
        sprint_name: sprintFilter,
        status: statusFilter,
      },
    ],
    () =>
      defectsAPI.getDefects({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        project_id: projectFilter || undefined,
        task_id: taskFilter || undefined,
        sprint_name: sprintFilter || undefined,
        status: statusFilter || undefined,
      }),
    {
      keepPreviousData: true,
    },
  );

  const defects = defectsResponse?.data || [];
  const pagination = defectsResponse?.pagination || null;
  const filterOptions = defectsResponse?.filters;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "reference",
        headerName: "REFERENCE",
        minWidth: 170,
        flex: 0.9,
        cellClassName: "defect-reference-cell",
        renderCell: (params) => (
          <Box sx={{ minWidth: 0, py: 0.75 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "rgb(15, 23, 42)", lineHeight: 1.35 }}
            >
              {params.row.reference_code}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgb(100, 116, 139)", lineHeight: 1.45, mt: 0.25, display: "block" }}
            >
              {formatShortDate(params.row.created_at)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "title",
        headerName: "DEFECT",
        minWidth: 260,
        flex: 1.4,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "rgb(15, 23, 42)", lineHeight: 1.35 }}>
              {params.row.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgb(100, 116, 139)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.45,
                mt: 0.25,
              }}
            >
              {params.row.description || "No description"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "project",
        headerName: "PROJECT",
        minWidth: 160,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap sx={{ color: "rgb(15, 23, 42)" }}>
            {params.row.project?.name || "Unknown project"}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "STATUS",
        minWidth: 150,
        flex: 0.9,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const tone = statusToneMap[params.row.status as Defect["status"]];
          return (
            <Chip
              label={params.row.status}
              size="small"
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                height: 24,
                borderRadius: "999px",
                border: `1px solid ${tone.border}`,
                bgcolor: tone.bg,
                color: tone.color,
              }}
            />
          );
        },
      },
      {
        field: "severity",
        headerName: "SEVERITY",
        minWidth: 125,
        flex: 0.75,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const tone = severityToneMap[params.row.severity as Defect["severity"]];
          return (
            <Chip
              label={params.row.severity}
              size="small"
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                height: 24,
                borderRadius: "999px",
                border: `1px solid ${tone.border}`,
                bgcolor: tone.bg,
                color: tone.color,
              }}
            />
          );
        },
      },
      {
        field: "priority",
        headerName: "PRIORITY",
        minWidth: 125,
        flex: 0.75,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const tone = priorityToneMap[params.row.priority as Defect["priority"]];
          return (
            <Chip
              label={params.row.priority}
              size="small"
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                height: 24,
                borderRadius: "999px",
                border: `1px solid ${tone.border}`,
                bgcolor: tone.bg,
                color: tone.color,
              }}
            />
          );
        },
      },
      {
        field: "assignee",
        headerName: "ASSIGNEE",
        minWidth: 135,
        flex: 0.8,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const assignee = params.row.assignee as Defect["assignee"];
          if (!assignee) {
            return (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "0.65rem",
                  bgcolor: "rgb(241, 245, 249)",
                  color: "rgb(100, 116, 139)",
                  border: "1px solid rgb(226, 232, 240)",
                }}
              >
                ??
              </Avatar>
            );
          }
          return (
            <Avatar
              title={assignee.full_name}
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.65rem",
                bgcolor: "rgba(59, 130, 246, 0.12)",
                color: "rgb(29, 78, 216)",
                border: "1px solid rgba(96, 165, 250, 0.18)",
              }}
            >
              {assignee.full_name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
          );
        },
      },
      {
        field: "task",
        headerName: "TASK",
        minWidth: 220,
        flex: 1.1,
        renderCell: (params) => {
          const relatedTask = params.row.created_task || params.row.linked_task;
          return (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "rgb(15, 23, 42)", lineHeight: 1.35 }}>
                {relatedTask?.title || "No task linked"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgb(100, 116, 139)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: 1.45,
                  mt: 0.25,
                }}
              >
                {relatedTask?.id || "Auto-create on approval"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "sprint",
        headerName: "SPRINT",
        minWidth: 140,
        flex: 0.8,
        renderCell: (params) => (
          <Typography variant="body2" noWrap sx={{ color: "rgb(15, 23, 42)" }}>
            {params.row.sprint_name || "No sprint"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 130,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/test-defects/${params.row.id}`);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View details
          </button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Quality
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Defects</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Review real defects from the workspace, see who raised and owns each
              issue, and approve them into linked engineering tasks.
            </p>
          </div>
          <button
            onClick={() => navigate("/test-defects/raise")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-lg">bug_report</span>
            <span>Raise Defect</span>
          </button>
        </div>

        <div className="mb-6">
          <TestCaseNav links={defectSectionLinks} />
        </div>

        {createdDefectId ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Created defect{" "}
            <span className="font-semibold">
              {createdDefectReferenceCode || createdDefectTitle || "successfully"}
            </span>
            . Open it from the table to view the full defect detail page.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load defects.
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search defects, references, projects, or tasks..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All Projects</option>
              {(filterOptions?.projects || []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All Tasks</option>
              {(filterOptions?.tasks || []).map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <select
              value={sprintFilter}
              onChange={(event) => setSprintFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All Sprints</option>
              {(filterOptions?.sprints || []).map((sprint) => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All Statuses</option>
              {["Open", "Approved", "Rejected", "In Progress", "Resolved"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setProjectFilter("");
                setTaskFilter("");
                setSprintFilter("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)]">
          <DataGrid
            rows={defects}
            columns={columns}
            loading={isLoading || isFetching}
            autoHeight
            pagination
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            rowCount={pagination?.total ?? defects.length}
            paginationModel={{
              page: currentPage - 1,
              pageSize: itemsPerPage,
            }}
            onPaginationModelChange={(model) => {
              if (model.pageSize !== itemsPerPage) {
                setItemsPerPage(model.pageSize);
                setCurrentPage(1);
                return;
              }
              if (model.page + 1 !== currentPage) {
                setCurrentPage(model.page + 1);
              }
            }}
            disableRowSelectionOnClick
            rowHeight={96}
            columnHeaderHeight={52}
            getRowClassName={(params) =>
              params.row.id === createdDefectId ? "defect-row-highlight" : ""
            }
            onRowClick={(params) => navigate(`/test-defects/${params.row.id}`)}
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
              "& .MuiDataGrid-cell.defect-reference-cell": {
                alignItems: "flex-start",
                paddingTop: "14px",
                paddingBottom: "14px",
              },
              "& .MuiDataGrid-row": {
                minHeight: "96px !important",
                maxHeight: "96px !important",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(248, 250, 252, 0.78)",
                },
              },
              "& .MuiDataGrid-row.defect-row-highlight": {
                backgroundColor: "rgba(239, 246, 255, 0.88)",
              },
              "& .MuiDataGrid-row.defect-row-highlight:hover": {
                backgroundColor: "rgba(219, 234, 254, 0.96)",
              },
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
              "& .MuiDataGrid-footerContainer": {
                minHeight: 56,
                borderTop: "1px solid rgb(226, 232, 240)",
                backgroundColor: "rgba(248, 250, 252, 0.72)",
              },
              "& .MuiDataGrid-overlayWrapper": {
                minHeight: "220px",
              },
            }}
            slots={{
              noRowsOverlay: () => (
                <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                  <Typography sx={{ fontWeight: 700, color: "rgb(15, 23, 42)" }}>
                    No defects found
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "rgb(100, 116, 139)" }}>
                    Try changing the server-side filters or search term.
                  </Typography>
                </Stack>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
