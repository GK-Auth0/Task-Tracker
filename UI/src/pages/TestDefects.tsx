import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { defectSectionLinks } from "../data/testManagement";
import TestCaseNav from "../components/testcases/TestCaseNav";
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

export default function TestDefects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [sprintFilter, setSprintFilter] = useState("All Sprints");
  const [taskFilter, setTaskFilter] = useState("All Tasks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [reviewingDefectId, setReviewingDefectId] = useState("");
  const [rejectingDefectId, setRejectingDefectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadDefects = async () => {
    try {
      setLoading(true);
      const response = await defectsAPI.getDefects();
      if (response.success) {
        setDefects(response.data);
      }
    } catch (error) {
      console.error("Failed to load defects:", error);
      setActionError("Failed to load defects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefects();
  }, []);

  const projectOptions = useMemo(
    () => ["All Projects", ...new Set(defects.map((defect) => defect.project?.name).filter(Boolean))],
    [defects],
  );

  const taskOptions = useMemo(
    () => [
      "All Tasks",
      ...new Set(
        defects
          .map((defect) => defect.linked_task?.title || defect.created_task?.title)
          .filter(Boolean),
      ),
    ],
    [defects],
  );

  const sprintOptions = useMemo(
    () => ["All Sprints", ...new Set(defects.map((defect) => defect.sprint_name).filter(Boolean))],
    [defects],
  );

  const visibleDefects = useMemo(() => {
    return defects.filter((defect) => {
      const taskName = defect.linked_task?.title || defect.created_task?.title || "";
      const matchesProject =
        projectFilter === "All Projects" || defect.project?.name === projectFilter;
      const matchesSprint =
        sprintFilter === "All Sprints" || defect.sprint_name === sprintFilter;
      const matchesTask = taskFilter === "All Tasks" || taskName === taskFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || defect.status === statusFilter;
      return matchesProject && matchesSprint && matchesTask && matchesStatus;
    });
  }, [defects, projectFilter, sprintFilter, taskFilter, statusFilter]);

  const canReview = user?.role === "Admin" || user?.role === "Member";

  const handleApprove = async (defectId: string) => {
    try {
      setReviewingDefectId(defectId);
      setActionError("");
      setActionMessage("");
      const response = await defectsAPI.reviewDefect(defectId, "approve");
      setActionMessage(
        response.data.created_task
          ? `Defect approved and task ${response.data.created_task.title} created.`
          : "Defect approved.",
      );
      await loadDefects();
    } catch (error: any) {
      console.error("Failed to approve defect:", error);
      setActionError(
        error?.response?.data?.message || "Failed to approve defect",
      );
    } finally {
      setReviewingDefectId("");
    }
  };

  const handleReject = async (defectId: string) => {
    if (!rejectReason.trim()) {
      setActionError("Reject reason is required");
      return;
    }

    try {
      setReviewingDefectId(defectId);
      setActionError("");
      setActionMessage("");
      await defectsAPI.reviewDefect(defectId, "reject", rejectReason.trim());
      setActionMessage("Defect rejected.");
      setRejectingDefectId("");
      setRejectReason("");
      await loadDefects();
    } catch (error: any) {
      console.error("Failed to reject defect:", error);
      setActionError(
        error?.response?.data?.message || "Failed to reject defect",
      );
    } finally {
      setReviewingDefectId("");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Quality
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Defects
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Review real defects from the workspace, see who raised and owns each
              issue, and approve them into linked engineering tasks.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <button
              onClick={() => navigate("/test-defects/raise")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-lg">bug_report</span>
              <span>Raise Defect</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <TestCaseNav links={defectSectionLinks} />
        </div>

        {actionMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}
        {actionError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {projectOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {taskOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={sprintFilter}
              onChange={(event) => setSprintFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {sprintOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {["All Statuses", "Open", "Approved", "Rejected", "In Progress", "Resolved"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Loading defects...
            </div>
          ) : null}

          {!loading &&
            visibleDefects.map((defect) => {
              const showRejectBox = rejectingDefectId === defect.id;
              const relatedTask = defect.created_task || defect.linked_task;
              return (
                <section
                  key={defect.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {defect.reference_code}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[defect.status]}`}
                        >
                          {defect.status}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {defect.severity} severity
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {defect.priority} priority
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {defect.title}
                        </h2>
                        <p className="mt-1 max-w-3xl text-sm text-slate-600">
                          {defect.description}
                        </p>
                      </div>
                    </div>

                    {canReview && defect.status === "Open" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(defect.id)}
                          disabled={reviewingDefectId === defect.id}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewingDefectId === defect.id ? "Working..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRejectingDefectId((current) =>
                              current === defect.id ? "" : defect.id,
                            )
                          }
                          className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Project
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {defect.project?.name || "Unknown project"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Creator / Assignee
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {defect.creator?.full_name || "Unknown creator"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Assigned to {defect.assignee?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Linked Task
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {relatedTask?.title || "No task linked yet"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {relatedTask?.id || "Task will be auto-created on approval"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Run / Case / Sprint
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {defect.linked_run || "No run"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {defect.linked_case || "No case"} • {defect.sprint_name || "No sprint"}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(defect.reproduction_steps) &&
                  defect.reproduction_steps.length ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Reproduction Steps
                      </p>
                      <div className="mt-2 space-y-2">
                        {defect.reproduction_steps.map((step, index) => (
                          <div
                            key={`${defect.id}-${index}`}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            <span className="font-semibold text-slate-900">
                              {index + 1}.
                            </span>{" "}
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {defect.status === "Rejected" && defect.rejection_reason ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      <span className="font-semibold">Reject reason:</span>{" "}
                      {defect.rejection_reason}
                    </div>
                  ) : null}

                  {showRejectBox ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                          Reject reason
                        </span>
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-400"
                          placeholder="Explain why this defect is being rejected"
                        />
                      </label>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(defect.id)}
                          disabled={reviewingDefectId === defect.id}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewingDefectId === defect.id ? "Saving..." : "Confirm Reject"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingDefectId("");
                            setRejectReason("");
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}

          {!loading && !visibleDefects.length ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">
                No defects match the selected filters.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another project, task, sprint, or status to broaden the list.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
