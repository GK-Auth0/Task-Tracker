export interface TableExportColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string;
}

interface TableExportActionsProps<T> {
  rows: T[];
  selectedRows?: T[];
  columns: TableExportColumn<T>[];
  fileNamePrefix: string;
  allLabel?: string;
  selectedLabel?: string;
  variant?: "default" | "inline";
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
  rows,
  selectedRows = [],
  columns,
  fileNamePrefix,
  allLabel = "Export all",
  selectedLabel = "Export selected",
  variant = "default",
}: TableExportActionsProps<T>) {
  const dateSuffix = new Date().toISOString().slice(0, 10);

  const handleExportAll = () => {
    downloadCsv(rows, columns, `${fileNamePrefix}-${dateSuffix}.csv`);
  };

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return;
    downloadCsv(selectedRows, columns, `${fileNamePrefix}-selected-${dateSuffix}.csv`);
  };

  const buttonWrapClass =
    variant === "inline" ? "flex flex-wrap items-center gap-1" : "flex flex-wrap items-center gap-2";
  const baseButtonClass =
    variant === "inline"
      ? "h-8 rounded-md border px-2 text-xs font-medium"
      : "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold";

  return (
    <div className={buttonWrapClass}>
      <button
        type="button"
        className={`${baseButtonClass} border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={handleExportAll}
        disabled={rows.length === 0}
      >
        <span className="material-symbols-outlined text-base">download</span>
        {allLabel}
      </button>
      <button
        type="button"
        className={`${baseButtonClass} border border-blue-600 bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-300 disabled:bg-blue-300`}
        onClick={handleExportSelected}
        disabled={selectedRows.length === 0}
      >
        <span className="material-symbols-outlined text-base">table_view</span>
        {selectedLabel}
        {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
      </button>
    </div>
  );
}

export default TableExportActions;
