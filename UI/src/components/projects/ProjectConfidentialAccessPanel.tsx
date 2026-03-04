import React from "react";
import { useMemo, useState } from "react";

type AccessRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  decision_note?: string;
  requested_at?: string;
  requester?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
};

interface ProjectConfidentialAccessPanelProps {
  canViewConfidential: boolean;
  requestStatus: "none" | "pending" | "approved" | "rejected";
  requestReason: string;
  submitting: boolean;
  onRequestReasonChange: (value: string) => void;
  onSubmitRequest: () => void;
  showReviewList: boolean;
  reviewItems: AccessRequest[];
  reviewing: string;
  onReview: (requestId: string, action: "approve" | "reject") => void;
}

const ProjectConfidentialAccessPanel: React.FC<ProjectConfidentialAccessPanelProps> = ({
  canViewConfidential,
  requestStatus,
  requestReason,
  submitting,
  onRequestReasonChange,
  onSubmitRequest,
  showReviewList,
  reviewItems,
  reviewing,
  onReview,
}) => {
  const [expanded, setExpanded] = useState(false);

  const requestStatusTone =
    requestStatus === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : requestStatus === "pending"
        ? "bg-amber-100 text-amber-700"
        : requestStatus === "rejected"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";

  const requestCount = reviewItems.filter((item) => item.status === "pending").length;
  const buttonLabel = useMemo(() => {
    if (expanded) return "Hide";
    if (!canViewConfidential && requestStatus === "none") return "Request Access";
    return "View";
  }, [expanded, canViewConfidential, requestStatus]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Confidential Access
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {canViewConfidential
              ? "Confidential details are visible"
              : "Some project details are restricted"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Members can work on tasks immediately. Sensitive project details require
            owner/admin approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${requestStatusTone}`}>
            {canViewConfidential ? "Access Granted" : `Request: ${requestStatus}`}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {!expanded && showReviewList && requestCount > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {requestCount} pending confidential access request{requestCount === 1 ? "" : "s"}
        </div>
      )}

      {expanded && !canViewConfidential && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Why do you need confidential details?
          </label>
          <textarea
            value={requestReason}
            onChange={(event) => onRequestReasonChange(event.target.value)}
            className="w-full min-h-[92px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            placeholder="Example: I need roadmap/files access to execute release planning for next sprint."
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Current status: {requestStatus}
            </p>
            <button
              type="button"
              onClick={onSubmitRequest}
              disabled={submitting || requestStatus === "pending"}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Request Access"}
            </button>
          </div>
        </div>
      )}

      {expanded && showReviewList && (
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800">
              Access Requests Review
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {reviewItems.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500">
                No access requests yet.
              </p>
            ) : (
              reviewItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex flex-wrap gap-3 items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.requester?.full_name || "Member"}
                    </p>
                    <p className="text-xs text-slate-500">{item.requester?.email || ""}</p>
                    {item.reason && (
                      <p className="mt-1 text-sm text-slate-700">{item.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">
                      {item.status}
                    </span>
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onReview(item.id, "approve")}
                          disabled={reviewing === item.id}
                          className="h-8 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReview(item.id, "reject")}
                          disabled={reviewing === item.id}
                          className="h-8 px-3 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectConfidentialAccessPanel;
