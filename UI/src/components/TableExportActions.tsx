export interface TableExportColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string;
}

interface TableExportActionsProps<T> {
  title?: string;
  description?: string;
  rows: T[];
  selectedRows?: T[];
  columns: TableExportColumn<T>[];
  fileNamePrefix: string;
  allLabel?: string;
  selectedLabel?: string;
}

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

const downloadCsv = <T,>(rows: T[], columns: TableExportColumn<T>[], fileName: string) => {
  const csvRows = [
    columns.map((column) => escapeCsvValue(column.label)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => escapeCsvValue(column.value(row)))
        .join(","),
    ),
  ];

  const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

function TableExportActions<T>({
  title = "Table Export",
  description = "Export all visible rows or only the rows you select.",
  rows,
  selectedRows = [],
  columns,
  fileNamePrefix,
  allLabel = "Export all",
  selectedLabel = "Export selected",
}: TableExportActionsProps<T>) {
  const dateSuffix = new Date().toISOString().slice(0, 10);

  const handleExportAll = () => {
    downloadCsv(rows, columns, `${fileNamePrefix}-${dateSuffix}.csv`);
  };

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return;
    downloadCsv(selectedRows, columns, `${fileNamePrefix}-selected-${dateSuffix}.csv`);
  };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleExportAll}
          disabled={rows.length === 0}
        >
          <span className="material-symbols-outlined text-base">download</span>
          {allLabel}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          onClick={handleExportSelected}
          disabled={selectedRows.length === 0}
        >
          <span className="material-symbols-outlined text-base">table_view</span>
          {selectedLabel}
          {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
        </button>
      </div>
    </div>
  );
}

export default TableExportActions;
