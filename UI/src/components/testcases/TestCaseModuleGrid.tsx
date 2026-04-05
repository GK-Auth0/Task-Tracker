import { useMemo, useState } from "react";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { encodeModuleSlug } from "../../utils/testCases";
import type { TestCaseRecord } from "../../types/testCase";

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

export default function TestCaseModuleGrid({
  items,
  loading,
  onOpenModule,
}: TestCaseModuleGridProps) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const rows = useMemo<ModuleRow[]>(
    () =>
      items.map(({ module, items: moduleCases }) => ({
        id: module,
        module,
        projects: compactText(moduleCases.map((item) => item.project?.name), "No project"),
        sprint: compactText(moduleCases.map((item) => item.sprint_name), "No sprint"),
        caseCount: moduleCases.length,
        suites: compactText(moduleCases.map((item) => item.suite), "No suite"),
        linkedTasks: moduleCases.filter((item) => item.linked_task).length,
        moduleSlug: encodeModuleSlug(module),
      })),
    [items],
  );

  const columns = useMemo<GridColDef<ModuleRow>[]>(
    () => [
      {
        field: "module",
        headerName: "Module",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <div className="py-2">
            <p className="text-sm font-semibold text-slate-900">{params.row.module}</p>
            <p className="mt-1 text-xs text-slate-500">
              {params.row.linkedTasks} linked tasks
            </p>
          </div>
        ),
      },
      {
        field: "projects",
        headerName: "Project",
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: "sprint",
        headerName: "Sprint",
        flex: 0.9,
        minWidth: 160,
      },
      {
        field: "caseCount",
        headerName: "Cases",
        width: 100,
      },
      {
        field: "suites",
        headerName: "Suites",
        flex: 1,
        minWidth: 200,
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
            onClick={() => onOpenModule(params.row.moduleSlug)}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Open
          </button>
        ),
      },
    ],
    [onOpenModule],
  );

  if (!loading && !rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No modules found yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
            <p className="mt-1 text-xs text-slate-500">
              Open a module to see its cases on the next page.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {rows.length} modules
          </span>
        </div>
      </div>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        rowHeight={72}
        columnHeaderHeight={48}
        sx={{
          border: 0,
          height: 560,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(248, 250, 252, 0.8)",
            color: "rgb(15, 23, 42)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(226, 232, 240, 0.35)",
          },
          "& .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid rgb(226 232 240)",
            backgroundColor: "rgba(248, 250, 252, 0.8)",
          },
        }}
      />
    </div>
  );
}
