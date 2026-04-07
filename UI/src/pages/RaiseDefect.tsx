import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { defectSectionLinks } from "../data/testManagement";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { useAuth } from "../contexts/AuthContext";
import { defectsAPI } from "../services/defects";
import { projectsAPI, tasksAPI, usersAPI } from "../services/dashboard";
import { sprintsAPI } from "../services/sprints";

type ProjectOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  full_name: string;
  email: string;
};

type TaskOption = {
  id: string;
  title: string;
  project: {
    id: string;
    name: string;
  };
};

type SprintOption = {
  id: string;
  name: string;
  project_id: string;
};

const severityOptions = ["Critical", "High", "Medium", "Low"] as const;
const priorityOptions = ["Critical", "High", "Medium", "Low"] as const;

export default function RaiseDefect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [sprints, setSprints] = useState<SprintOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [severity, setSeverity] = useState<(typeof severityOptions)[number]>("Medium");
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>("Medium");
  const [description, setDescription] = useState("");
  const [reproductionStepsInput, setReproductionStepsInput] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [linkedRun, setLinkedRun] = useState("");
  const [linkedCase, setLinkedCase] = useState("");
  const [environment, setEnvironment] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [projectsResponse, usersResponse, tasksResponse, sprintsResponse] = await Promise.all([
          projectsAPI.getProjects(),
          usersAPI.getUsers({ limit: 200 }),
          tasksAPI.getTasks({ limit: 200 }),
          sprintsAPI.getSprints(),
        ]);

        if (projectsResponse.success) {
          setProjects(projectsResponse.data);
          if (projectsResponse.data.length === 1) {
            setProjectId(projectsResponse.data[0].id);
          }
        }

        if (usersResponse.success) {
          setUsers(usersResponse.data);
        }

        if (tasksResponse.success) {
          setTasks(tasksResponse.data as TaskOption[]);
        }

        if (sprintsResponse.success) {
          setSprints(
            sprintsResponse.data.map((item) => ({
              id: item.id,
              name: item.name,
              project_id: item.project_id,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load defect form options:", error);
        setSubmitError("Failed to load project, task, sprint, and user options");
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!projectId) {
      setLinkedTaskId("");
      setSprintId("");
      return;
    }

    if (linkedTaskId && !tasks.some((task) => task.id === linkedTaskId && task.project?.id === projectId)) {
      setLinkedTaskId("");
    }
    if (sprintId && !sprints.some((sprint) => sprint.id === sprintId && sprint.project_id === projectId)) {
      setSprintId("");
    }
  }, [linkedTaskId, projectId, sprintId, sprints, tasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => !projectId || task.project?.id === projectId),
    [projectId, tasks],
  );

  const filteredSprints = useMemo(
    () => sprints.filter((sprint) => !projectId || sprint.project_id === projectId),
    [projectId, sprints],
  );

  const parsedSteps = reproductionStepsInput
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean);

  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedTask = filteredTasks.find((task) => task.id === linkedTaskId);
  const selectedSprint = filteredSprints.find((sprint) => sprint.id === sprintId);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!projectId || !title.trim() || !description.trim()) {
      setSubmitError("Project, summary, and description are required");
      return;
    }

    try {
      setSubmitting(true);
      await defectsAPI.createDefect({
        title: title.trim(),
        description: description.trim(),
        reproduction_steps: parsedSteps,
        severity,
        priority,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        linked_task_id: linkedTaskId || undefined,
        sprint_id: sprintId || undefined,
        sprint_name: selectedSprint?.name || undefined,
        linked_run: linkedRun.trim() || undefined,
        linked_case: linkedCase.trim() || undefined,
        environment: environment.trim() || undefined,
      });
      navigate("/test-defects");
    } catch (error: any) {
      console.error("Failed to create defect:", error);
      setSubmitError(
        error?.response?.data?.message || "Failed to create defect",
      );
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
              Raise Defect
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Capture a real defect with its project, assignee, creator, linked
              task, and reproduction details so review can happen quickly.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              <span>{submitting ? "Creating..." : "Create Defect"}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <TestCaseNav links={defectSectionLinks} />
        </div>

        {submitError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Defect details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Summary
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Describe the defect clearly"
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
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Assignee
                  </span>
                  <select
                    value={assigneeId}
                    onChange={(event) => setAssigneeId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Linked task
                  </span>
                  <select
                    value={linkedTaskId}
                    onChange={(event) => setLinkedTaskId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    <option value="">No linked task</option>
                    {filteredTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Severity
                  </span>
                  <select
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value as (typeof severityOptions)[number])
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {severityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Priority
                  </span>
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as (typeof priorityOptions)[number])
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {priorityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Description
                </span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  placeholder="What happened and what should have happened instead?"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Reproduction steps
                </span>
                <textarea
                  rows={5}
                  value={reproductionStepsInput}
                  onChange={(event) => setReproductionStepsInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  placeholder={"Enter one step per line\nOpen page\nPerform action\nObserve incorrect result"}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter one step per line. These steps will also be copied into the
                  auto-created task when the defect is approved.
                </p>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Linked delivery context</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sprint
                  </span>
                  <select
                    value={sprintId}
                    onChange={(event) => setSprintId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  >
                    <option value="">No sprint</option>
                    {filteredSprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Test Run
                  </span>
                  <input
                    value={linkedRun}
                    onChange={(event) => setLinkedRun(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Regression Run 9"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Test Case
                  </span>
                  <input
                    value={linkedCase}
                    onChange={(event) => setLinkedCase(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="TC-104"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Environment
                  </span>
                  <input
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="Staging • Chrome 124 • Build 2026.04.05"
                  />
                </label>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Review snapshot</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Creator:</span>{" "}
                  {user?.full_name || "Current user"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Project:</span>{" "}
                  {selectedProject?.name || "Not selected"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Linked task:</span>{" "}
                  {selectedTask?.title || "No task linked"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Reproduction steps:</span>{" "}
                  {parsedSteps.length}
                </p>
                <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-blue-700">
                  Approved defects automatically create a task and keep the defect
                  linked to that task.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Suggested attachments</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Console logs</p>
                <p>Screenshots or screen recording</p>
                <p>API request and response payload</p>
                <p>Build version and browser details</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
