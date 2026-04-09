import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { defectsAPI } from "../services/defects";
import { useAuth } from "../contexts/AuthContext";
import type { Defect } from "../types/defect";

const statusClasses: Record<Defect["status"], string> = {
  Open: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
  Resolved: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function DefectDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingDefectId, setReviewingDefectId] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const canReview = user?.role === "Admin" || user?.role === "Member";
  const createdDefectId = location.state?.createdDefectId as string | undefined;
  const createdDefectReferenceCode = location.state?.createdDefectReferenceCode as
    | string
    | undefined;
  const createdDefectTitle = location.state?.createdDefectTitle as string | undefined;

  const loadDefect = async () => {
    try {
      setLoading(true);
      const response = await defectsAPI.getDefects();
      if (response.success) {
        setDefect(response.data.find((item) => item.id === id) || null);
      }
    } catch (error) {
      console.error("Failed to load defect:", error);
      setActionError("Failed to load defect");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefect();
  }, [id]);

  const relatedTask = useMemo(
    () => defect?.created_task || defect?.linked_task || null,
    [defect],
  );

  const linkedTaskRoute = defect?.linked_task?.id
    ? `/task/${defect.linked_task.id}`
    : undefined;
  const createdTaskRoute = defect?.created_task?.id
    ? `/task/${defect.created_task.id}`
    : undefined;

  const handleApprove = async () => {
    if (!defect) return;

    try {
      setReviewingDefectId(defect.id);
      setActionError("");
      setActionMessage("");
      const response = await defectsAPI.reviewDefect(defect.id, "approve");
      setActionMessage(
        response.data.created_task
          ? `Defect approved and task ${response.data.created_task.title} created.`
          : "Defect approved.",
      );
      setDefect(response.data);
      await loadDefect();
    } catch (error: any) {
      console.error("Failed to approve defect:", error);
      setActionError(error?.response?.data?.message || "Failed to approve defect");
    } finally {
      setReviewingDefectId("");
    }
  };

  const handleReject = async () => {
    if (!defect) return;
    if (!rejectReason.trim()) {
      setActionError("Reject reason is required");
      return;
    }

    try {
      setReviewingDefectId(defect.id);
      setActionError("");
      setActionMessage("");
      const response = await defectsAPI.reviewDefect(defect.id, "reject", rejectReason.trim());
      setActionMessage("Defect rejected.");
      setShowRejectBox(false);
      setRejectReason("");
      setDefect(response.data);
      await loadDefect();
    } catch (error: any) {
      console.error("Failed to reject defect:", error);
      setActionError(error?.response?.data?.message || "Failed to reject defect");
    } finally {
      setReviewingDefectId("");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title={defect?.title || "Defect"}
          description="Review the full defect record, traceability, reproduction path, and QA decision history in one focused page."
          metaLabel="Reference"
          metaValue={defect?.reference_code || "Loading"}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/test-defects")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to defects
              </button>
              <button
                type="button"
                onClick={() => navigate("/test-defects/raise")}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Raise Defect
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          {actionMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionMessage}
            </div>
          ) : null}
          {!actionMessage && createdDefectId === defect?.id ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Created defect{" "}
              <span className="font-semibold">
                {createdDefectReferenceCode || createdDefectTitle || "successfully"}
              </span>
              . Review its full traceability details here.
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Loading defect...
            </div>
          ) : !defect ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">Defect not found.</p>
              <p className="mt-2 text-sm text-slate-500">
                This defect may have been removed or you may not have access to it.
              </p>
            </div>
          ) : (
            <>
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#ffffff_100%)] px-6 py-6 sm:px-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                          {defect.reference_code}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[defect.status]}`}
                        >
                          {defect.status}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                          {defect.severity} severity
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                          {defect.priority} priority
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Defect Summary
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                          {defect.description}
                        </p>
                      </div>
                    </div>

                    {canReview && defect.status === "Open" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={reviewingDefectId === defect.id}
                          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewingDefectId === defect.id ? "Working..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectBox((current) => !current)}
                          className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Project
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {defect.project?.name || "Unknown project"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        People
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {defect.creator?.full_name || "Unknown creator"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Assigned to {defect.assignee?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Coverage
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {defect.linked_run || "No run"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {defect.linked_case || "No case"} • {defect.sprint_name || "No sprint"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Environment
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {defect.environment || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 sm:px-8">
                  <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                      <section>
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Task Traceability
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                              Linked engineering work
                            </h2>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4 text-sm text-slate-600">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Originally linked task
                            </p>
                            {defect.linked_task?.id ? (
                              <Link
                                to={linkedTaskRoute!}
                                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                              >
                                {defect.linked_task.title}
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </Link>
                            ) : (
                              <p className="mt-2 text-slate-500">No task linked during creation.</p>
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Execution task
                            </p>
                            {defect.created_task?.id ? (
                              <Link
                                to={createdTaskRoute!}
                                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                              >
                                {defect.created_task.title}
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </Link>
                            ) : relatedTask?.id ? (
                              <p className="mt-2 text-slate-500">
                                Using the linked task until a dedicated fix task is created.
                              </p>
                            ) : (
                              <p className="mt-2 text-slate-500">
                                No execution task yet. Approving this defect will create one automatically.
                              </p>
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Quick actions
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {linkedTaskRoute ? (
                                <Link
                                  to={linkedTaskRoute}
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                                >
                                  <span className="material-symbols-outlined text-base">link</span>
                                  Open linked task
                                </Link>
                              ) : null}
                              {createdTaskRoute ? (
                                <Link
                                  to={createdTaskRoute}
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                                >
                                  <span className="material-symbols-outlined text-base">task</span>
                                  Open execution task
                                </Link>
                              ) : null}
                              {defect.project?.id ? (
                                <Link
                                  to={`/projects/${defect.project.id}`}
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                                >
                                  <span className="material-symbols-outlined text-base">folder</span>
                                  Open project
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </section>

                      {Array.isArray(defect.reproduction_steps) && defect.reproduction_steps.length ? (
                        <section>
                          <div className="border-b border-slate-200 pb-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Reproduction
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                              Steps to reproduce
                            </h2>
                          </div>

                          <ol className="mt-5 space-y-4">
                            {defect.reproduction_steps.map((step, index) => (
                              <li key={`${defect.id}-${index}`} className="flex gap-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                  {index + 1}
                                </span>
                                <p className="pt-1 text-sm leading-7 text-slate-600">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </section>
                      ) : null}
                    </div>

                    <aside className="space-y-8">
                      <section>
                        <div className="border-b border-slate-200 pb-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Decision
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            QA review status
                          </h2>
                        </div>

                        <div className="mt-4 space-y-4 text-sm text-slate-600">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Current state
                            </p>
                            <div className="mt-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[defect.status]}`}
                              >
                                {defect.status}
                              </span>
                            </div>
                          </div>

                          {defect.status === "Rejected" && defect.rejection_reason ? (
                            <div className="border-t border-slate-100 pt-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Reject reason
                              </p>
                              <p className="mt-2 leading-7 text-rose-700">{defect.rejection_reason}</p>
                            </div>
                          ) : null}

                          {showRejectBox ? (
                            <div className="border-t border-slate-100 pt-4">
                              <label className="block">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                  Reject reason
                                </span>
                                <textarea
                                  rows={4}
                                  value={rejectReason}
                                  onChange={(event) => setRejectReason(event.target.value)}
                                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-300 focus:bg-white"
                                  placeholder="Explain why this defect is being rejected"
                                />
                              </label>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={handleReject}
                                  disabled={reviewingDefectId === defect.id}
                                  className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {reviewingDefectId === defect.id ? "Saving..." : "Confirm Reject"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowRejectBox(false);
                                    setRejectReason("");
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <div className="border-b border-slate-200 pb-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Record
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            Defect details
                          </h2>
                        </div>

                        <dl className="mt-4 space-y-4 text-sm">
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-slate-400">Reference</dt>
                            <dd className="text-right font-semibold text-slate-900">{defect.reference_code}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-4">
                            <dt className="text-slate-400">Created by</dt>
                            <dd className="text-right font-semibold text-slate-900">
                              {defect.creator?.full_name || "Unknown creator"}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-4">
                            <dt className="text-slate-400">Assigned to</dt>
                            <dd className="text-right font-semibold text-slate-900">
                              {defect.assignee?.full_name || "Unassigned"}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-4">
                            <dt className="text-slate-400">Priority</dt>
                            <dd className="text-right font-semibold text-slate-900">{defect.priority}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-4">
                            <dt className="text-slate-400">Severity</dt>
                            <dd className="text-right font-semibold text-slate-900">{defect.severity}</dd>
                          </div>
                        </dl>
                      </section>
                    </aside>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
