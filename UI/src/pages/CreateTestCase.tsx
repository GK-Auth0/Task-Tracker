import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { qaSectionLinks } from "../data/testManagement";
import { projectsAPI, tasksAPI } from "../services/dashboard";
import { testCasesAPI } from "../services/testCases";
import { useAuth } from "../contexts/AuthContext";
import type { TestAutomation, TestCasePriority, TestCaseStatus } from "../types/testCase";

type ProjectOption = {
  id: string;
  name: string;
};

type TaskOption = {
  id: string;
  title: string;
  project: {
    id: string;
    name: string;
  };
};

type StepDraft = {
  id: number;
  action: string;
  expected: string;
};

const priorityOptions: TestCasePriority[] = ["Critical", "High", "Medium", "Low"];
const automationOptions: TestAutomation[] = ["Manual", "Automated", "Candidate"];
const statusOptions: TestCaseStatus[] = ["Draft", "Ready", "Blocked", "Passed", "Failed"];

export default function CreateTestCase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sprintName, setSprintName] = useState("");
  const [suite, setSuite] = useState("");
  const [module, setModule] = useState("");
  const [priority, setPriority] = useState<TestCasePriority>("Medium");
  const [automation, setAutomation] = useState<TestAutomation>("Manual");
  const [status, setStatus] = useState<TestCaseStatus>("Draft");
  const [preconditionsInput, setPreconditionsInput] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([
    { id: 1, action: "", expected: "" },
    { id: 2, action: "", expected: "" },
  ]);
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [linkedStoryId, setLinkedStoryId] = useState("");
  const [linkedStoryTitle, setLinkedStoryTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          projectsAPI.getProjects(),
          tasksAPI.getTasks({ limit: 200 }),
        ]);

        if (projectsResponse.success) {
          setProjects(projectsResponse.data);
          if (projectsResponse.data.length === 1) {
            setProjectId(projectsResponse.data[0].id);
          }
        }

        if (tasksResponse.success) {
          setTasks(tasksResponse.data as TaskOption[]);
        }
      } catch (error) {
        console.error("Failed to load test case form options:", error);
        setSubmitError("Failed to load project and task options");
      }
    };

    loadOptions();
  }, []);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => !projectId || task.project?.id === projectId),
    [projectId, tasks],
  );

  useEffect(() => {
    if (!projectId) {
      setLinkedTaskId("");
      return;
    }

    if (linkedTaskId && !filteredTasks.some((task) => task.id === linkedTaskId)) {
      setLinkedTaskId("");
    }
  }, [filteredTasks, linkedTaskId, projectId]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedTask = filteredTasks.find((task) => task.id === linkedTaskId);

  const handleStepChange = (id: number, field: "action" | "expected", value: string) => {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
    );
  };

  const handleAddStep = () => {
    setSteps((current) => [
      ...current,
      { id: current.length + 1, action: "", expected: "" },
    ]);
  };

  const handleRemoveStep = (id: number) => {
    setSteps((current) =>
      current
        .filter((step) => step.id !== id)
        .map((step, index) => ({ ...step, id: index + 1 })),
    );
  };

  const handleSubmit = async () => {
    setSubmitError("");

    const parsedPreconditions = preconditionsInput
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedTags = tagsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedSteps = steps
      .filter((step) => step.action.trim() && step.expected.trim())
      .map((step, index) => ({
        id: index + 1,
        action: step.action.trim(),
        expected: step.expected.trim(),
      }));

    if (!title.trim() || !projectId || !suite.trim() || !module.trim() || !parsedSteps.length) {
      setSubmitError("Title, project, suite, module, and at least one valid step are required");
      return;
    }

    const linkedItems: Array<{
      id: string;
      type: "Story" | "Bug" | "Requirement";
      title: string;
    }> = [];
    if (linkedStoryId.trim() && linkedStoryTitle.trim()) {
      linkedItems.push({
        id: linkedStoryId.trim(),
        type: "Story" as const,
        title: linkedStoryTitle.trim(),
      });
    }

    try {
      setSubmitting(true);
      await testCasesAPI.createTestCase({
        title: title.trim(),
        project_id: projectId,
        linked_task_id: linkedTaskId || undefined,
        suite: suite.trim(),
        module: module.trim(),
        sprint_name: sprintName.trim() || undefined,
        priority,
        status,
        automation,
        tags: parsedTags,
        preconditions: parsedPreconditions,
        steps: parsedSteps,
        linked_items: linkedItems,
        execution_history: [],
      });
      navigate("/test-cases");
    } catch (error: any) {
      console.error("Failed to create test case:", error);
      setSubmitError(error?.response?.data?.message || "Failed to create test case");
    } finally {
      setSubmitting(false);
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
              Create Test Case
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Create a reusable test case with linked project, task, sprint, and
              requirement context.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{submitting ? "Saving..." : "Save Test Case"}</span>
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            {qaSectionLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {submitError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Case details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Describe the reusable test case"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Project
                  </span>
                  <select
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Select project</option>
                    {projects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sprint
                  </span>
                  <input
                    value={sprintName}
                    onChange={(event) => setSprintName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Sprint 24 Regression"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Suite
                  </span>
                  <input
                    value={suite}
                    onChange={(event) => setSuite(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Authentication"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Module
                  </span>
                  <input
                    value={module}
                    onChange={(event) => setModule(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Password Reset"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Priority
                  </span>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as TestCasePriority)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {priorityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Automation
                  </span>
                  <select
                    value={automation}
                    onChange={(event) => setAutomation(event.target.value as TestAutomation)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {automationOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TestCaseStatus)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {statusOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Preconditions
                </span>
                <textarea
                  rows={4}
                  value={preconditionsInput}
                  onChange={(event) => setPreconditionsInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  placeholder={"Add one precondition per line\nA user account exists\nEmail auth is enabled"}
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Tags
                </span>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  placeholder="regression, security, api"
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Test steps</h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Add Step
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        Step {step.id}
                      </p>
                      {steps.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(step.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      rows={2}
                      value={step.action}
                      onChange={(event) =>
                        handleStepChange(step.id, "action", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                      placeholder="Action"
                    />
                    <textarea
                      rows={2}
                      value={step.expected}
                      onChange={(event) =>
                        handleStepChange(step.id, "expected", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                      placeholder="Expected result"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Linked delivery context</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Task
                  </span>
                  <select
                    value={linkedTaskId}
                    onChange={(event) => setLinkedTaskId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    <option value="">No linked task</option>
                    {filteredTasks.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Story ID
                  </span>
                  <input
                    value={linkedStoryId}
                    onChange={(event) => setLinkedStoryId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="AUTH-72"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Story Title
                  </span>
                  <input
                    value={linkedStoryTitle}
                    onChange={(event) => setLinkedStoryTitle(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Secure email authentication"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Review snapshot</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Owner:</span>{" "}
                  {user?.full_name || "Current user"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Project:</span>{" "}
                  {selectedProject?.name || "Not selected"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Linked task:</span>{" "}
                  {selectedTask?.title || "No linked task"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Valid steps:</span>{" "}
                  {steps.filter((step) => step.action.trim() && step.expected.trim()).length}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
