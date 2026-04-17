import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseFiltersBar from "../components/testcases/TestCaseFiltersBar";
import { testCasesAPI } from "../services/testCases";
import type { TestAutomation, TestCaseRecord, TestCaseStatus } from "../types/testCase";
import { automationClasses, statusClasses } from "../data/testManagement";
import { decodeModuleSlug } from "../utils/testCases";

type RunStatus = "Passed" | "Failed" | "Blocked";

const RUN_OPTIONS: { status: RunStatus; label: string; icon: string; bg: string; text: string }[] = [
  { status: "Passed",  label: "Pass",  icon: "task_alt",       bg: "hover:bg-emerald-500", text: "text-emerald-600 hover:text-white" },
  { status: "Failed",  label: "Fail",  icon: "cancel",         bg: "hover:bg-rose-500",    text: "text-rose-600 hover:text-white" },
  { status: "Blocked", label: "Block", icon: "do_not_disturb", bg: "hover:bg-amber-500",   text: "text-amber-600 hover:text-white" },
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

const executionBadge: Record<string, string> = {
  Passed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-300 bg-rose-50 text-rose-700",
  Blocked: "border-amber-300 bg-amber-50 text-amber-700",
};

function InlineCaseDetail({ testCase }: { testCase: TestCaseRecord }) {
  const lastRun = testCase.execution_history[testCase.execution_history.length - 1] ?? null;

  return (
    <div className="border-t-2 border-blue-500 bg-slate-50 px-6 py-5 space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold text-blue-600 tracking-wide">{testCase.reference_code}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{testCase.title}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[testCase.status]}`}>
            {testCase.status}
          </span>
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${automationClasses[testCase.automation]}`}>
            {testCase.automation}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Preconditions */}
        {testCase.preconditions.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Preconditions</p>
            <ul className="space-y-1.5">
              {testCase.preconditions.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-blue-100 text-center text-[10px] font-bold text-blue-600 leading-4">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last execution */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Last Execution</p>
          {lastRun ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${executionBadge[lastRun.status] ?? ""}`}>
                  {lastRun.status}
                </span>
                <span className="text-xs text-slate-400">{timeAgo(lastRun.executedAt)}</span>
              </div>
              <p className="text-xs text-slate-600">Tester: {lastRun.tester}</p>
              {lastRun.note && <p className="text-xs text-slate-500 italic">{lastRun.note}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No executions recorded yet.</p>
          )}
        </div>
      </div>

      {/* Steps */}
      {testCase.steps.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Test Steps</p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="w-8 px-3 py-2">#</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Expected Result</th>
                </tr>
              </thead>
              <tbody>
                {testCase.steps.map((step, i) => (
                  <tr key={step.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 text-slate-700">{step.action}</td>
                    <td className="px-3 py-2 text-slate-500">{step.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestCaseModuleDetail() {
  const navigate = useNavigate();
  const { moduleSlug = "" } = useParams();
  const moduleName = decodeModuleSlug(moduleSlug);

  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TestCaseStatus>("All");
  const [automationFilter, setAutomationFilter] = useState<"All" | TestAutomation>("All");
  const [loading, setLoading] = useState(true);
  const [caseStatuses, setCaseStatuses] = useState<Record<string, RunStatus>>({});
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const handleRun = async (id: string, status: RunStatus) => {
    await testCasesAPI.addExecution(id, { status });
    setCaseStatuses((prev) => ({ ...prev, [id]: status }));
  };

  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCases(response.data.filter((item) => item.module === moduleName));
        }
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCases();
  }, [moduleName]);

  const filteredCases = useMemo(() => {
    return testCases.filter((testCase) => {
      const matchesQuery =
        !query.trim() ||
        `${testCase.reference_code} ${testCase.title} ${testCase.suite} ${testCase.project?.name || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || testCase.status === statusFilter;
      const matchesAutomation =
        automationFilter === "All" || testCase.automation === automationFilter;

      return matchesQuery && matchesStatus && matchesAutomation;
    });
  }, [automationFilter, query, statusFilter, testCases]);

  const projects = Array.from(new Set(testCases.map((item) => item.project?.name).filter(Boolean)));
  const sprints = Array.from(new Set(testCases.map((item) => item.sprint_name).filter(Boolean)));
  const linkedTaskCount = testCases.filter((item) => item.linked_task).length;
  const columns = useMemo<GridColDef<TestCaseRecord>[]>(
    () => [
      {
        field: "reference_code",
        headerName: "Case",
        minWidth: 270,
        flex: 1.3,
        sortable: false,
        renderCell: (params) => {
          const isExpanded = expandedCase === params.row.id;
          return (
            <div className="py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isExpanded ? "rotate-90 text-blue-600" : "text-slate-400"}`}
                >
                  chevron_right
                </span>
                <span className="font-mono text-xs font-bold text-blue-600 tracking-wide">
                  {params.row.reference_code}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{params.row.title}</p>
            </div>
          );
        },
      },
      {
        field: "suite",
        headerName: "Suite",
        minWidth: 150,
        flex: 0.85,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 120,
        flex: 0.7,
        renderCell: (params) => {
          const display = (caseStatuses[params.row.id] ?? params.row.status) as keyof typeof statusClasses;
          return (
            <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[display] ?? statusClasses[params.row.status]}`}>
              {display}
            </span>
          );
        },
      },
      {
        field: "automation",
        headerName: "Automation",
        minWidth: 130,
        flex: 0.75,
        renderCell: (params) => (
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${automationClasses[params.row.automation]}`}>
            {params.row.automation}
          </span>
        ),
      },
      {
        field: "owner",
        headerName: "Owner",
        minWidth: 160,
        flex: 0.85,
        valueGetter: (_value, row) => row.owner?.full_name || "Unknown",
      },
      {
        field: "updated_at",
        headerName: "Last Updated",
        minWidth: 130,
        flex: 0.75,
        renderCell: (params) => (
          <span className="text-xs font-semibold text-slate-400">{timeAgo(params.row.updated_at)}</span>
        ),
      },
      {
        field: "linked_task",
        headerName: "Linked Task",
        minWidth: 200,
        flex: 1,
        sortable: false,
        valueGetter: (_value, row) => row.linked_task?.title || "—",
      },
      {
        field: "actions",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 160,
        renderCell: (params) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <RunButton testCaseId={params.row.id} onRun={handleRun} />
            <button
              type="button"
              onClick={() => navigate(`/test-cases/case/${params.row.id}`)}
              className="text-xs font-bold text-slate-400 transition hover:text-blue-700"
            >
              Open →
            </button>
          </div>
        ),
      },
    ],
    [navigate, caseStatuses, expandedCase],
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title={moduleName || "Module"}
          description="Review module-level scope, filter the working list, and open a full case page only when deeper detail is needed."
          metaLabel="Cases in module"
          metaValue={`${testCases.length}`}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/test-cases")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to modules
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Projects
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {projects.length ? projects.join(", ") : "No project linked"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Sprints
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {sprints.length ? sprints.join(", ") : "No sprint linked"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Linked tasks
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">{linkedTaskCount}</p>
            </div>
          </div>

          <TestCaseFiltersBar
            query={query}
            statusFilter={statusFilter}
            automationFilter={automationFilter}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            onAutomationChange={setAutomationFilter}
          />

          {!loading && !filteredCases.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No test cases match the current filters.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Try another status, automation type, or search phrase to broaden the result.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)]">
              <DataGrid
                rows={filteredCases}
                columns={columns}
                loading={loading}
                pagination
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                rowHeight={62}
                columnHeaderHeight={52}
                onRowClick={(params) =>
                  setExpandedCase((prev) => (prev === params.row.id ? null : params.row.id))
                }
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
                  "& .MuiDataGrid-row": {
                    minHeight: "62px !important",
                    maxHeight: "62px !important",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(239, 246, 255, 0.78)",
                    },
                  },
                  "& .MuiDataGrid-columnSeparator": {
                    display: "none",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    minHeight: 56,
                    borderTop: "1px solid rgb(226, 232, 240)",
                    backgroundColor: "rgba(248, 250, 252, 0.72)",
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
              {expandedCase && (() => {
                const tc = filteredCases.find((c) => c.id === expandedCase);
                if (!tc) return null;
                // merge live status into the record for the detail panel
                const merged = caseStatuses[tc.id]
                  ? { ...tc, status: caseStatuses[tc.id] as TestCaseRecord["status"] }
                  : tc;
                return <InlineCaseDetail testCase={merged} />;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
