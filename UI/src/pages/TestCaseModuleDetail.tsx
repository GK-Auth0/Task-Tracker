import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseFiltersBar from "../components/testcases/TestCaseFiltersBar";
import { testCasesAPI } from "../services/testCases";
import type { TestAutomation, TestCaseRecord, TestCaseStatus } from "../types/testCase";
import { automationClasses, statusClasses } from "../data/testManagement";
import { decodeModuleSlug } from "../utils/testCases";

export default function TestCaseModuleDetail() {
  const navigate = useNavigate();
  const { moduleSlug = "" } = useParams();
  const moduleName = decodeModuleSlug(moduleSlug);

  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TestCaseStatus>("All");
  const [automationFilter, setAutomationFilter] = useState<"All" | TestAutomation>("All");
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

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
        minWidth: 290,
        flex: 1.3,
        sortable: false,
        renderCell: (params) => (
          <div className="py-2">
            <p className="text-sm font-semibold text-slate-900">{params.row.reference_code}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{params.row.title}</p>
          </div>
        ),
      },
      {
        field: "suite",
        headerName: "Suite",
        minWidth: 170,
        flex: 0.9,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.75,
        renderCell: (params) => (
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[params.row.status]}`}>
            {params.row.status}
          </span>
        ),
      },
      {
        field: "automation",
        headerName: "Automation",
        minWidth: 140,
        flex: 0.8,
        renderCell: (params) => (
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${automationClasses[params.row.automation]}`}>
            {params.row.automation}
          </span>
        ),
      },
      {
        field: "owner",
        headerName: "Owner",
        minWidth: 180,
        flex: 0.9,
        valueGetter: (_value, row) => row.owner?.full_name || "Unknown",
      },
      {
        field: "linked_task",
        headerName: "Linked Task",
        minWidth: 220,
        flex: 1,
        sortable: false,
        valueGetter: (_value, row) => row.linked_task?.title || "No linked task",
      },
      {
        field: "open",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 120,
        renderCell: (params) => (
          <button
            type="button"
            onClick={() => navigate(`/test-cases/case/${params.row.id}`)}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Open
          </button>
        ),
      },
    ],
    [navigate],
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
                    "&:hover": {
                      backgroundColor: "rgba(248, 250, 252, 0.78)",
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
