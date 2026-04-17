import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { encodeModuleSlug } from "../../utils/testCases";
import type { TestCaseRecord } from "../../types/testCase";
import { statusClasses, automationClasses } from "../../data/testManagement";
import { testCasesAPI } from "../../services/testCases";

interface ModuleItem {
  module: string;
  items: TestCaseRecord[];
}

interface TestCaseModuleGridProps {
  items: ModuleItem[];
  loading: boolean;
  onOpenModule: (moduleSlug: string) => void;
}

interface ModuleRow {
  id: string;
  module: string;
  projects: string;
  sprint: string;
  caseCount: number;
  suites: string;
  linkedTasks: number;
  moduleSlug: string;
}

const compactText = (items: Array<string | null | undefined>, emptyLabel: string) => {
  const values = Array.from(new Set(items.filter(Boolean) as string[]));
  if (!values.length) return emptyLabel;
  return values.join(", ");
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type RunStatus = "Passed" | "Failed" | "Blocked";

const RUN_OPTIONS: { status: RunStatus; label: string; icon: string; bg: string; text: string; border: string }[] = [
  { status: "Passed",  label: "Pass",  icon: "task_alt",       bg: "hover:bg-emerald-500", text: "text-emerald-600 hover:text-white", border: "border-emerald-200 hover:border-emerald-500" },
  { status: "Failed",  label: "Fail",  icon: "cancel",         bg: "hover:bg-rose-500",    text: "text-rose-600 hover:text-white",    border: "border-rose-200 hover:border-rose-500" },
  { status: "Blocked", label: "Block", icon: "do_not_disturb", bg: "hover:bg-amber-500",   text: "text-amber-600 hover:text-white",   border: "border-amber-200 hover:border-amber-500" },
];

function RunButton({
  testCaseId,
  onRun,
}: {
  testCaseId: string;
  onRun: (id: string, status: RunStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handle = async (status: RunStatus) => {
    setBusy(true);
    setOpen(false);
    await onRun(testCaseId, status);
    setBusy(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400 bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[14px]">
          {busy ? "progress_activity" : "play_arrow"}
        </span>
        Run
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 min-w-[130px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="border-b border-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Record result
          </p>
          {RUN_OPTIONS.map((opt) => (
            <button
              key={opt.status}
              type="button"
              onClick={() => handle(opt.status)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold transition ${opt.bg} ${opt.text}`}
            >
              <span className="material-symbols-outlined text-[15px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  Passed:  "bg-emerald-500",
  Failed:  "bg-rose-500",
  Blocked: "bg-amber-400",
  Ready:   "bg-blue-500",
  Draft:   "bg-slate-400",
};

export default function TestCaseModuleGrid({
  items,
  loading,
  onOpenModule,
}: TestCaseModuleGridProps) {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [caseStatuses, setCaseStatuses] = useState<Record<string, RunStatus>>({});

  const rows = useMemo<ModuleRow[]>(
    () =>
      items.map(({ module, items: moduleCases }) => ({
        id: module,
        module,
        projects: compactText(moduleCases.map((item) => item.project?.name), "—"),
        sprint: compactText(moduleCases.map((item) => item.sprint_name), "—"),
        caseCount: moduleCases.length,
        suites: compactText(moduleCases.map((item) => item.suite), "—"),
        linkedTasks: moduleCases.filter((item) => item.linked_task).length,
        moduleSlug: encodeModuleSlug(module),
      })),
    [items],
  );

  const expandedCases = useMemo<TestCaseRecord[]>(() => {
    if (!expandedModule) return [];
    return items.find((g) => g.module === expandedModule)?.items ?? [];
  }, [expandedModule, items]);

  const handleRun = async (id: string, status: RunStatus) => {
    await testCasesAPI.addExecution(id, { status });
    setCaseStatuses((prev) => ({ ...prev, [id]: status }));
  };

  /* ── inner case columns ─────────────────────────────────────────── */
  const caseColumns = useMemo<GridColDef<TestCaseRecord>[]>(
    () => [
      {
        field: "reference_code",
        headerName: "Case",
        minWidth: 260,
        flex: 1.4,
        sortable: false,
        renderCell: (params) => (
          <div className="py-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 tracking-wide">
                {params.row.reference_code}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[caseStatuses[params.row.id] ?? params.row.status] ?? "bg-slate-400"}`} />
            </div>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{params.row.title}</p>
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 115,
        flex: 0.7,
        renderCell: (params) => {
          const display = (caseStatuses[params.row.id] ?? params.row.status) as keyof typeof statusClasses;
          return (
            <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${statusClasses[display] ?? statusClasses[params.row.status]}`}>
              {display}
            </span>
          );
        },
      },
      {
        field: "automation",
        headerName: "Automation",
        minWidth: 125,
        flex: 0.7,
        renderCell: (params) => (
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${automationClasses[params.row.automation]}`}>
            {params.row.automation}
          </span>
        ),
      },
      {
        field: "updated_at",
        headerName: "Last Updated",
        minWidth: 120,
        flex: 0.7,
        renderCell: (params) => (
          <span className="text-xs font-semibold text-slate-400">{timeAgo(params.row.updated_at)}</span>
        ),
      },
      {
        field: "actions",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 155,
        renderCell: (params) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <RunButton testCaseId={params.row.id} onRun={handleRun} />
            <button
              type="button"
              onClick={() => navigate(`/test-cases/case/${params.row.id}`)}
              className="text-xs font-bold text-slate-400 transition hover:text-slate-900"
            >
              Open →
            </button>
          </div>
        ),
      },
    ],
    [navigate, caseStatuses],
  );

  /* ── module columns ─────────────────────────────────────────────── */
  const columns = useMemo<GridColDef<ModuleRow>[]>(
    () => [
      {
        field: "module",
        headerName: "Module",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const isExpanded = expandedModule === params.row.module;
          return (
            <div className="flex items-center gap-3 py-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isExpanded ? "bg-blue-600" : "bg-slate-100"}`}>
                <span className={`material-symbols-outlined text-[15px] transition-all ${isExpanded ? "rotate-90 text-white" : "text-slate-500"}`}>
                  chevron_right
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold transition-colors ${isExpanded ? "text-blue-700" : "text-slate-900"}`}>
                  {params.row.module}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{params.row.linkedTasks} linked tasks</p>
              </div>
            </div>
          );
        },
      },
      {
        field: "projects",
        headerName: "Project",
        flex: 1.1,
        minWidth: 200,
        renderCell: (params) => (
          <span className="text-sm font-medium text-slate-700">{params.value}</span>
        ),
      },
      {
        field: "sprint",
        headerName: "Sprint",
        flex: 0.85,
        minWidth: 150,
        renderCell: (params) => (
          <span className="text-sm font-medium text-slate-700">{params.value}</span>
        ),
      },
      {
        field: "caseCount",
        headerName: "Cases",
        width: 90,
        renderCell: (params) => (
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            {params.value}
          </span>
        ),
      },
      {
        field: "suites",
        headerName: "Suites",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <span className="text-sm font-medium text-slate-600">{params.value}</span>
        ),
      },
      {
        field: "open",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 110,
        renderCell: (params) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenModule(params.row.moduleSlug); }}
            className="text-xs font-bold text-slate-400 transition hover:text-blue-700"
          >
            Full page →
          </button>
        ),
      },
    ],
    [onOpenModule, expandedModule],
  );

  if (!loading && !rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300">category</span>
        <p className="mt-3 text-sm font-bold text-slate-500">No modules found yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-400">category</span>
              <h2 className="text-base font-extrabold tracking-tight text-white">Module Directory</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Click a row to expand · Run shortcuts log results instantly
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs font-bold text-slate-200">
              {rows.length} modules
            </span>
            <span className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300">
              {items.reduce((acc, g) => acc + g.items.length, 0)} cases
            </span>
          </div>
        </div>
      </div>

      {/* ── Module DataGrid ──────────────────────────────────────────── */}
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        rowHeight={76}
        columnHeaderHeight={44}
        onRowClick={(params) =>
          setExpandedModule((prev) => (prev === params.row.module ? null : params.row.module))
        }
        sx={{
          border: 0,
          cursor: "pointer",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgb(248 250 252)",
            color: "rgb(71 85 105)",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            borderBottom: "2px solid rgb(226 232 240)",
          },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 800 },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgb(241 245 249)",
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
          },
          "& .MuiDataGrid-row": {
            transition: "background 0.12s",
            "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.04)" },
          },
          "& .MuiDataGrid-columnSeparator": { display: "none" },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid rgb(226 232 240)",
            backgroundColor: "rgb(248 250 252)",
          },
        }}
      />

      {/* ── Inline expanded panel ────────────────────────────────────── */}
      {expandedModule && (
        <div className="border-t-[3px] border-blue-600">

          {/* Panel header */}
          <div className="flex items-center justify-between gap-3 bg-blue-600 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-blue-200">view_list</span>
              <p className="text-sm font-extrabold tracking-tight text-white">{expandedModule}</p>
              <span className="rounded-md border border-blue-400/50 bg-blue-500/40 px-2.5 py-0.5 text-xs font-bold text-white">
                {expandedCases.length} cases
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenModule(encodeModuleSlug(expandedModule))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-[13px]">open_in_full</span>
                Full page
              </button>
              <button
                type="button"
                onClick={() => setExpandedModule(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>

          {/* Case sub-table */}
          <div className="bg-slate-50/60 p-4">
            {expandedCases.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                No test cases in this module.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
                <DataGrid
                  rows={expandedCases}
                  columns={caseColumns}
                  disableRowSelectionOnClick
                  hideFooterPagination={expandedCases.length <= 10}
                  hideFooter={expandedCases.length <= 10}
                  rowHeight={60}
                  columnHeaderHeight={42}
                  autoHeight
                  sx={{
                    border: 0,
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "rgb(15 23 42)",
                      color: "rgb(148 163 184)",
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      borderBottom: "none",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 800 },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid rgb(241 245 249)",
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 14px",
                      overflow: "visible",
                    },
                    "& .MuiDataGrid-row": {
                      "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.03)" },
                    },
                    "& .MuiDataGrid-columnSeparator": { display: "none" },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "1px solid rgb(226 232 240)",
                      backgroundColor: "rgb(248 250 252)",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
