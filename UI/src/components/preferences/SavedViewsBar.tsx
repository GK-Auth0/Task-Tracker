import React from "react";
import { useState } from "react";

interface SavedViewOption {
  id: string;
  name: string;
}

interface SavedViewsBarProps {
  title: string;
  views: SavedViewOption[];
  selectedId: string;
  viewName: string;
  onSelectedIdChange: (id: string) => void;
  onViewNameChange: (name: string) => void;
  onApply: () => void;
  onSave: () => void;
  onDelete: () => void;
  saving?: boolean;
}

const SavedViewsBar: React.FC<SavedViewsBarProps> = ({
  title,
  views,
  selectedId,
  viewName,
  onSelectedIdChange,
  onViewNameChange,
  onApply,
  onSave,
  onDelete,
  saving = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
          <span className="ml-2 text-slate-400 normal-case">({views.length})</span>
        </p>
        <button
          type="button"
          className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? "Hide" : "Manage Views"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 flex flex-1 flex-wrap items-center gap-2">
          <select
            value={selectedId}
            onChange={(event) => onSelectedIdChange(event.target.value)}
            className="h-9 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Select saved view</option>
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={onApply}
            disabled={!selectedId}
          >
            Apply
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-rose-300 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            onClick={onDelete}
            disabled={!selectedId}
          >
            Delete
          </button>
          <input
            value={viewName}
            onChange={(event) => onViewNameChange(event.target.value)}
            placeholder="New view name"
            className="h-9 min-w-[170px] rounded-lg border border-slate-300 px-3 text-sm"
          />
          <button
            type="button"
            className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={onSave}
            disabled={saving || !viewName.trim()}
          >
            {saving ? "Saving..." : "Save Current"}
          </button>
        </div>
      )}
    </section>
  );
};

export default SavedViewsBar;
