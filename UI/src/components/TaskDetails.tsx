import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TaskDetailHeader from "./task-detail/TaskDetailHeader";
import TaskDetailSidebar from "./task-detail/TaskDetailSidebar";
import TaskOverviewTab from "./task-detail/TaskOverviewTab";
import TaskAiTab from "./task-detail/TaskAiTab";
import TaskTestCases from "./task-detail/TaskTestCases";
import TaskPRsTab from "./task-detail/TaskPRsTab";
import TaskActivityTab from "./task-detail/TaskActivityTab";
import TaskAttachmentsTab from "./task-detail/TaskAttachmentsTab";
import { useTaskDetails } from "../hooks/useTaskDetails";
import { isDoneTaskStatus, type TaskStatusValue } from "../utils/taskStatus";
import { TaskStatus } from "../enums";

type TaskTab = "overview" | "ai" | "prs" | "activity" | "attachments";

const isTaskTab = (value: string | null): value is TaskTab =>
  value === "overview" ||
  value === "ai" ||
  value === "prs" ||
  value === "activity" ||
  value === "attachments";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return { bg: "bg-red-500", text: "text-red-600" };
    case "Medium":
      return { bg: "bg-amber-500", text: "text-amber-600" };
    case "Low":
      return { bg: "bg-emerald-500", text: "text-emerald-600" };
    default:
      return { bg: "bg-slate-500", text: "text-slate-600" };
  }
};

export default function TaskDetails() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TaskTab>("overview");
  const testCasesRef = useRef<HTMLDivElement | null>(null);
  const fetchedPrTabForTaskRef = useRef<string | null>(null);
  const fetchedActivityTabForTaskRef = useRef<string | null>(null);
  const fetchedAiTabForTaskRef = useRef<string | null>(null);

  const {
    task,
    loading,
    taskError,
    deleteError,
    pullRequests,
    commits,
    activityLogs,
    prLoading,
    activityLoading,
    statusSaving,
    prioritySaving,
    deleteSaving,
    aiSuggestion,
    aiLoading,
    aiError,
    workspaceUsers,
    linkedTestCases,
    testCasesLoading,
    testCaseRunLoadingId,
    projectModuleOptions,
    handleStatusUpdate,
    handlePriorityUpdate,
    handleTaskUpdate,
    handleDeleteTask,
    handleSubtaskCreate,
    handleSubtaskUpdate,
    handleSubtaskDelete,
    handleRunTestCase,
    handleTestCaseCreated,
    handleAttachmentUpload,
    handleLinkPR,
    fetchPRData,
    fetchActivityLogs,
    fetchAiSuggestion,
  } = useTaskDetails();

  useEffect(() => {
    const taskId = task?.id || null;
    fetchedPrTabForTaskRef.current = null;
    fetchedActivityTabForTaskRef.current = null;
    fetchedAiTabForTaskRef.current = null;
    if (!taskId) return;
  }, [task?.id]);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (isTaskTab(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", activeTab);
      return next;
    }, { replace: true });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (activeTab === "prs" && task?.id && fetchedPrTabForTaskRef.current !== task.id) {
      fetchedPrTabForTaskRef.current = task.id;
      fetchPRData();
    }
    if (
      activeTab === "ai" &&
      task?.id &&
      fetchedAiTabForTaskRef.current !== task.id &&
      !aiSuggestion &&
      !aiLoading
    ) {
      fetchedAiTabForTaskRef.current = task.id;
      fetchAiSuggestion();
    }
    if (
      activeTab === "activity" &&
      task?.id &&
      fetchedActivityTabForTaskRef.current !== task.id
    ) {
      fetchedActivityTabForTaskRef.current = task.id;
      fetchActivityLogs();
    }
  }, [activeTab, task?.id, aiLoading, aiSuggestion, fetchAiSuggestion, fetchPRData, fetchActivityLogs]);

  const handleStatusChange = async (newStatus: TaskStatusValue) => {
    await handleStatusUpdate(newStatus);
    if (activeTab === "activity") {
      fetchActivityLogs();
    }
  };

  const handlePriorityChange = async (newPriority: "Low" | "Medium" | "High") => {
    await handlePriorityUpdate(newPriority);
    if (activeTab === "activity") {
      fetchActivityLogs();
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/tasks");
  };

  const handleOpenProject = () => {
    if (!task) return;
    navigate(`/projects/${task.project.id}`);
  };

  const handleEdit = () => {
    setActiveTab("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddTestCase = () => {
    setActiveTab("overview");
    window.requestAnimationFrame(() => {
      testCasesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDelete = async () => {
    const success = await handleDeleteTask();
    if (success && task) {
      navigate(`/projects/${task.project.id}`);
    }
  };

  const derived = useMemo(() => {
    if (!task) return null;

    const createdAtDate = new Date(task.created_at);
    const updatedAtDate = new Date(task.updated_at);
    const dueDateObj = task.due_date ? new Date(task.due_date) : null;
    const hasValidDueDate = !!dueDateObj && !Number.isNaN(dueDateObj.getTime());
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysSinceCreated = Number.isNaN(createdAtDate.getTime())
      ? 0
      : Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / dayMs));
    const daysToDue = hasValidDueDate
      ? Math.ceil((dueDateObj!.getTime() - now.getTime()) / dayMs)
      : null;
    const completedSubtasks = (task.subtasks || []).filter((subtask) => subtask.is_completed).length;
    const assigneeLabel = task.assignee?.full_name || "Unassigned";
    const assigneeInitials = task.assignee?.full_name
      ? task.assignee.full_name
          .split(" ")
          .map((name) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?";
    const dueDateLabel = hasValidDueDate
      ? dueDateObj!.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No deadline";
    const createdDateLabel = Number.isNaN(createdAtDate.getTime())
      ? "Unknown"
      : createdAtDate.toLocaleDateString();
    const slaLabel = isDoneTaskStatus(task.status)
      ? "Delivered"
      : daysToDue === null
        ? "No Deadline"
        : daysToDue < 0
          ? `Overdue ${Math.abs(daysToDue)}d`
          : daysToDue === 0
            ? "Due Today"
            : `${daysToDue}d Remaining`;
    const issueHealthTone = isDoneTaskStatus(task.status)
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : daysToDue !== null && daysToDue < 0
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

    return {
      issueKey: `TASK-${task.id.slice(-3)}`,
      issueTypeLabel: task.issue_type || "Task",
      priorityColors: getPriorityColor(task.priority),
      completedSubtasks,
      createdAtDate,
      updatedAtDate,
      daysSinceCreated,
      slaLabel,
      activityPulse: activityLogs.length > 0 ? "Active" : "Quiet",
      assigneeLabel,
      assigneeInitials,
      dueDateLabel,
      createdDateLabel,
      issueHealthTone,
    };
  }, [task, activityLogs.length]);

  const taskTabs: Array<{ id: TaskTab; label: string; icon: string; count?: number }> = [
    { id: "overview", label: "Overview", icon: "description" },
    { id: "ai", label: "AI Assistant", icon: "auto_awesome" },
    { id: "prs", label: "PRs & Code", icon: "code", count: pullRequests.length || undefined },
    { id: "activity", label: "Activity", icon: "history", count: activityLogs.length || undefined },
    { id: "attachments", label: "Attachments", icon: "attach_file" },
  ];

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex min-h-full max-w-[1440px] items-center justify-center p-4 sm:p-6 lg:p-8">
          Loading...
        </div>
      </div>
    );
  }

  if (!task || !derived) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex min-h-full max-w-[1440px] flex-col items-center justify-center gap-3 p-4 text-center sm:p-6 lg:p-8">
          <p>{taskError || "Task not found"}</p>
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto min-h-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
          <TaskDetailHeader
            issueKey={derived.issueKey}
            issueTypeLabel={derived.issueTypeLabel}
            title={task.title}
            projectName={task.project.name}
            taskStatus={task.status}
            taskPriority={task.priority}
            priorityColors={derived.priorityColors}
            createdDateLabel={derived.createdDateLabel}
            creatorName={task.creator.full_name}
            statusSaving={statusSaving}
            onOpenProject={handleOpenProject}
            onBack={handleBack}
            onStatusChange={handleStatusChange}
          />

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5 p-4 sm:p-5 lg:border-r lg:border-slate-200">
                {taskError && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {taskError}
                  </div>
                )}
                {deleteError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {deleteError}
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="py-3 sm:hidden">
                    <select
                      aria-label="Task detail tabs"
                      value={activeTab}
                      onChange={(event) => setActiveTab(event.target.value as TaskTab)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {taskTabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>
                          {tab.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden gap-2 overflow-x-auto scrollbar-hide sm:flex">
                    {taskTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              activeTab === tab.id
                                ? "bg-white/20 text-white"
                                : "bg-blue-600/10 text-blue-600"
                            }`}
                          >
                            {tab.count}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === "overview" && (
                  <>
                    <TaskOverviewTab
                      task={task}
                      workspaceUsers={workspaceUsers}
                      onTaskUpdate={handleTaskUpdate}
                      onSubtaskCreate={handleSubtaskCreate}
                      onSubtaskUpdate={handleSubtaskUpdate}
                      onSubtaskDelete={handleSubtaskDelete}
                    />
                    <div ref={testCasesRef}>
                      <TaskTestCases
                        task={task}
                        linkedTestCases={linkedTestCases}
                        testCasesLoading={testCasesLoading}
                        testCaseRunLoadingId={testCaseRunLoadingId}
                        projectModuleOptions={projectModuleOptions}
                        onTestCaseRun={handleRunTestCase}
                        onTestCaseCreated={handleTestCaseCreated}
                      />
                    </div>
                  </>
                )}

                {activeTab === "ai" && (
                  <TaskAiTab
                    aiSuggestion={aiSuggestion}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    prioritySaving={prioritySaving}
                    onPriorityUpdate={handlePriorityChange}
                    onRefreshAi={fetchAiSuggestion}
                  />
                )}

                {activeTab === "prs" && (
                  <TaskPRsTab
                    pullRequests={pullRequests}
                    commits={commits}
                    prLoading={prLoading}
                    onLinkPR={handleLinkPR}
                  />
                )}

                {activeTab === "activity" && (
                  <TaskActivityTab
                    activityLogs={activityLogs}
                    activityLoading={activityLoading}
                  />
                )}

                {activeTab === "attachments" && (
                  <TaskAttachmentsTab
                    attachments={task.attachments}
                    onAttachmentUpload={handleAttachmentUpload}
                  />
                )}
              </div>

              <TaskDetailSidebar
                assigneeInitials={derived.assigneeInitials}
                assigneeLabel={derived.assigneeLabel}
                projectName={task.project.name}
                sprintName={task.sprint?.name}
                dueDateLabel={derived.dueDateLabel}
                issueTypeLabel={derived.issueTypeLabel}
                taskPriority={task.priority}
                priorityColors={derived.priorityColors}
                createdAtLabel={
                  Number.isNaN(derived.createdAtDate.getTime())
                    ? "Unknown"
                    : derived.createdAtDate.toLocaleString()
                }
                updatedAtLabel={
                  Number.isNaN(derived.updatedAtDate.getTime())
                    ? "Unknown"
                    : derived.updatedAtDate.toLocaleString()
                }
                slaLabel={derived.slaLabel}
                pullRequestsCount={pullRequests.length}
                commitsCount={commits.length}
                activityLogsCount={activityLogs.length}
                completedSubtasks={derived.completedSubtasks}
                totalSubtasks={task.subtasks?.length || 0}
                deleteSaving={deleteSaving}
                onOpenProject={handleOpenProject}
                onAddTestCase={handleAddTestCase}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <div className="border-t border-slate-200 bg-white p-4 md:hidden">
                <button
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleStatusChange(TaskStatus.DONE)}
                  disabled={task.status === TaskStatus.DONE || statusSaving}
                >
                  {task.status === TaskStatus.DONE ? "Completed" : statusSaving ? "Updating..." : "Mark as Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
