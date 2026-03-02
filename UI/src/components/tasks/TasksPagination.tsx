import React from "react";
import { TasksPagination as TasksPaginationType } from "./types";

interface TasksPaginationProps {
  pagination: TasksPaginationType | null;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const TasksPagination: React.FC<TasksPaginationProps> = ({
  pagination,
  currentPage,
  itemsPerPage,
  onPageChange,
}) => {
  if (!pagination || pagination.total <= 0) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm text-slate-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
        {pagination.total} tasks
      </p>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev}
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
            if (pageNum > pagination.totalPages) return null;

            return (
              <button
                key={pageNum}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 bg-white border border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TasksPagination;
