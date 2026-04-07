import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SprintTabs from "../components/sprint/SprintTabs";
import TestCaseNav from "../components/testcases/TestCaseNav";
import CreateTestCaseDetailsTab from "../components/testcases/create/CreateTestCaseDetailsTab";
import CreateTestCaseHeader from "../components/testcases/create/CreateTestCaseHeader";
import CreateTestCaseLinksTab from "../components/testcases/create/CreateTestCaseLinksTab";
import CreateTestCaseReviewPanel from "../components/testcases/create/CreateTestCaseReviewPanel";
import CreateTestCaseStepsTab from "../components/testcases/create/CreateTestCaseStepsTab";
import { useAuth } from "../contexts/AuthContext";
import {
  testCasesAPI,
  testCaseModulesAPI,
  testCaseSuitesAPI,
  type TestCaseFormProjectOption,
  type TestCaseFormSprintOption,
  type TestCaseModuleOption,
  type TestCaseSuiteOption,
  type TestCaseFormTaskOption,
} from "../services/testCases";
import { tasksAPI } from "../services/dashboard";
import { sprintsAPI } from "../services/sprints";
import type {
  TestAutomation,
  TestCasePriority,
  TestCaseRecord,
  TestCaseStatus,
  TestStep,
} from "../types/testCase";

type CreateTab = "details" | "steps" | "links";

export default function CreateTestCase() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [projects, setProjects] = useState<TestCaseFormProjectOption[]>([]);
  const [tasks, setTasks] = useState<TestCaseFormTaskOption[]>([]);
  const [sprints, setSprints] = useState<TestCaseFormSprintOption[]>([]);
  const [suiteOptions, setSuiteOptions] = useState<TestCaseSuiteOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<TestCaseModuleOption[]>([]);
  const [existingCases, setExistingCases] = useState<TestCaseRecord[]>([]);

  const [activeTab, setActiveTab] = useState<CreateTab>("details");
  const [editingCaseId, setEditingCaseId] = useState("");
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sprintName, setSprintName] = useState("");
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [suite, setSuite] = useState("");
  const [module, setModule] = useState("");
  const [priority, setPriority] = useState<TestCasePriority>("Medium");
  const [automation, setAutomation] = useState<TestAutomation>("Manual");
  const [status, setStatus] = useState<TestCaseStatus>("Draft");
  const [preconditionsInput, setPreconditionsInput] = useState("");
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 1, action: "", expected: "" },
    { id: 2, action: "", expected: "" },
  ]);
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [linkedStoryId, setLinkedStoryId] = useState("");
  const [linkedStoryTitle, setLinkedStoryTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [prefillApplied, setPrefillApplied] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [response, modulesResponse, suitesResponse, testCasesResponse] = await Promise.all([
          testCasesAPI.getFormOptions(projectId ? { project_id: projectId } : undefined),
          testCaseModulesAPI.getModules(projectId ? { project_id: projectId } : undefined),
          testCaseSuitesAPI.getSuites(projectId ? { project_id: projectId } : undefined),
          testCasesAPI.getTestCases(),
        ]);

        if (response.success) {
          setProjects(response.data.projects);
          setTasks(response.data.tasks);
          setSprints(response.data.sprints);

          if (!projectId && response.data.projects.length === 1) {
            setProjectId(response.data.projects[0].id);
          }
        }

        if (suitesResponse.success) {
          setSuiteOptions(suitesResponse.data);
        }

        if (modulesResponse.success) {
          setModuleOptions(modulesResponse.data);
        }

        if (testCasesResponse.success) {
          setExistingCases(testCasesResponse.data);
        }
      } catch (error) {
        console.error("Failed to load test case form options:", error);
        setSubmitError("Failed to load project, sprint, task, and module options");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [projectId]);

  useEffect(() => {
    const sourceTaskId = searchParams.get("sourceTaskId");
    if (!sourceTaskId || prefillApplied || editingCaseId) return;

    const loadTaskContext = async () => {
      try {
        const response = await tasksAPI.getTask(sourceTaskId);
        if (!response.success) return;

        const sourceTask = response.data;
        setProjectId(sourceTask.project.id);
        setLinkedTaskId(sourceTask.id);
        setSprintName(sourceTask.sprint?.name || "");
        setIsCreatingSprint(false);
        setTitle((current) => (current.trim() ? current : `Verify ${sourceTask.title}`));
        setLinkedStoryTitle((current) =>
          current.trim() ? current : sourceTask.title,
        );
        setSuccessMessage(
          "Task context loaded. Project, linked task, sprint, and suggested title were prefilled.",
        );
        setPrefillApplied(true);
      } catch (error) {
        console.error("Failed to prefill from task:", error);
      }
    };

    void loadTaskContext();
  }, [editingCaseId, prefillApplied, searchParams]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) || null,
    [projectId, projects],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) => !projectId || task.project?.id === projectId),
    [projectId, tasks],
  );

  const filteredSprints = useMemo(
    () => sprints.filter((sprint) => !projectId || sprint.project_id === projectId),
    [projectId, sprints],
  );

  const sprintPreviewName = useMemo(() => {
    const sprintNumbers = filteredSprints
      .map((sprint) => {
        const match = sprint.name.match(/^Sprint[-\s]?(\d+)$/i);
        return match ? Number.parseInt(match[1], 10) : null;
      })
      .filter((value): value is number => Number.isFinite(value ?? NaN));

    const nextNumber = sprintNumbers.length ? Math.max(...sprintNumbers) + 1 : 1;
    return `Sprint-${nextNumber}`;
  }, [filteredSprints]);

  const selectedTask = useMemo(
    () => filteredTasks.find((task) => task.id === linkedTaskId) || null,
    [filteredTasks, linkedTaskId],
  );
  const isEditing = Boolean(editingCaseId);

  const validSteps = useMemo(
    () =>
      steps
        .filter((step) => step.action.trim() && step.expected.trim())
        .map((step, index) => ({
          id: index + 1,
          action: step.action.trim(),
          expected: step.expected.trim(),
        })),
    [steps],
  );

  useEffect(() => {
    if (linkedTaskId && !filteredTasks.some((task) => task.id === linkedTaskId)) {
      setLinkedTaskId("");
    }
  }, [filteredTasks, linkedTaskId]);

  const handleStepChange = (id: number, field: "action" | "expected", value: string) => {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
    );
  };

  const handleAddStep = () => {
    setSteps((current) => [...current, { id: current.length + 1, action: "", expected: "" }]);
  };

  const handleRemoveStep = (id: number) => {
    setSteps((current) =>
      current
        .filter((step) => step.id !== id)
        .map((step, index) => ({ ...step, id: index + 1 })),
    );
  };

  const resetForm = (preserveContext = false) => {
    setEditingCaseId("");
    setActiveTab("details");
    setTitle("");
    setLinkedTaskId("");
    setLinkedStoryId("");
    setLinkedStoryTitle("");
    setPreconditionsInput("");
    setTagsInput("");
    setSuccessMessage("");
    setSubmitError("");
    setPrefillApplied(false);
    setSteps([
      { id: 1, action: "", expected: "" },
      { id: 2, action: "", expected: "" },
    ]);

    if (!preserveContext) {
      setProjectId("");
      setSprintName("");
      setIsCreatingSprint(false);
      setSuite("");
      setModule("");
      setPriority("Medium");
      setAutomation("Manual");
      setStatus("Draft");
    }
  };

  const loadCaseIntoForm = (testCase: TestCaseRecord) => {
    setEditingCaseId(testCase.id);
    setActiveTab("details");
    setTitle(testCase.title);
    setProjectId(testCase.project_id);
    setSprintName(testCase.sprint_name || "");
    setIsCreatingSprint(false);
    setSuite(testCase.suite);
    setModule(testCase.module);
    setPriority(testCase.priority);
    setAutomation(testCase.automation);
    setStatus(testCase.status);
    setPreconditionsInput(testCase.preconditions.join("\n"));
    setTagsInput(testCase.tags.join(", "));
    setSteps(
      testCase.steps.length
        ? testCase.steps.map((step, index) => ({
            id: index + 1,
            action: step.action,
            expected: step.expected,
          }))
        : [
            { id: 1, action: "", expected: "" },
            { id: 2, action: "", expected: "" },
          ],
    );
    setLinkedTaskId(testCase.linked_task_id || "");
    const linkedStory = testCase.linked_items.find((item) => item.type === "Story");
    setLinkedStoryId(linkedStory?.id || "");
    setLinkedStoryTitle(linkedStory?.title || "");
    setSuccessMessage("");
    setSubmitError("");
  };

  const persistTestCase = async (saveAndAddAnother = false) => {
    setSubmitError("");
    setSuccessMessage("");

    const parsedPreconditions = preconditionsInput
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedTags = tagsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!title.trim() || !projectId || !suite.trim() || !module.trim() || !validSteps.length) {
      setSubmitError("Title, project, suite, module, and at least one valid step are required");
      setActiveTab(!title.trim() || !projectId || !suite.trim() || !module.trim() ? "details" : "steps");
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
        type: "Story",
        title: linkedStoryTitle.trim(),
      });
    }

    try {
      setSubmitting(true);
      let resolvedSprintName = sprintName.trim();
      let resolvedSprintId = "";
      const existingSprint = filteredSprints.find(
        (item) => item.name.trim().toLowerCase() === sprintName.trim().toLowerCase(),
      );

      if (isCreatingSprint && projectId && !existingSprint) {
        const createdSprintResponse = await sprintsAPI.createSprint({
          name: "AUTO_SPRINT_NAME",
          project_id: projectId,
          status: "Planning",
        });

        if (createdSprintResponse.success) {
          resolvedSprintName = createdSprintResponse.data.name;
          resolvedSprintId = createdSprintResponse.data.id;
          setSprintName(createdSprintResponse.data.name);
          setSprints((current) =>
            [...current, createdSprintResponse.data].sort((left, right) =>
              left.name.localeCompare(right.name),
            ),
          );
        }
      } else if (existingSprint) {
        resolvedSprintName = existingSprint.name;
        resolvedSprintId = existingSprint.id;
      }

      const existingSuite = suiteOptions.find(
        (item) =>
          item.project_id === projectId &&
          item.name.trim().toLowerCase() === suite.trim().toLowerCase(),
      );

      if (!existingSuite && suite.trim()) {
        const createdSuiteResponse = await testCaseSuitesAPI.createSuite({
          name: suite.trim(),
          project_id: projectId,
        });

        if (createdSuiteResponse.success) {
          setSuiteOptions((current) => {
            if (current.some((item) => item.id === createdSuiteResponse.data.id)) {
              return current;
            }
            return [...current, createdSuiteResponse.data].sort((left, right) =>
              left.name.localeCompare(right.name),
            );
          });
        }
      }

      const payload = {
        title: title.trim(),
        project_id: projectId,
        linked_task_id: linkedTaskId || undefined,
        suite: suite.trim(),
        module: module.trim(),
        sprint_id: resolvedSprintId || undefined,
        sprint_name: resolvedSprintName || undefined,
        priority,
        status,
        automation,
        tags: parsedTags,
        preconditions: parsedPreconditions,
        steps: validSteps,
        linked_items: linkedItems,
      };

      const response = editingCaseId
        ? await testCasesAPI.updateTestCase(editingCaseId, payload)
        : await testCasesAPI.createTestCase({
            ...payload,
            execution_history: [],
          });

      if (response.success) {
        setExistingCases((current) => {
          const remaining = current.filter((item) => item.id !== response.data.id);
          return [response.data, ...remaining];
        });

        if (saveAndAddAnother && !editingCaseId) {
          resetForm(true);
          setSuccessMessage("Test case saved. You can continue adding the next one.");
        } else {
          setEditingCaseId(response.data.id);
          loadCaseIntoForm(response.data);
          setSuccessMessage(
            editingCaseId
              ? "Test case updated successfully."
              : "Test case saved successfully. You can keep editing or start a new one.",
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to create test case:", error);
      setSubmitError(error?.response?.data?.message || "Failed to create test case");
    } finally {
      setSubmitting(false);
    }
  };

  const headerScope = selectedProject
    ? `${selectedProject.name}${sprintName ? ` • ${sprintName}` : ""}`
    : "Choose project and sprint";

  const completionItems = [
    { label: "Project", value: projectId ? "Set" : "Missing" },
    { label: "Suite", value: suite.trim() ? "Set" : "Missing" },
    { label: "Module", value: module.trim() ? "Set" : "Missing" },
    { label: "Valid steps", value: `${validSteps.length}/${steps.length}` },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <CreateTestCaseHeader
          metaValue={headerScope}
          submitting={submitting}
          onSave={() => void persistTestCase(false)}
          onSaveAndAddAnother={() => void persistTestCase(true)}
          onStartFresh={() => resetForm(false)}
          isEditing={isEditing}
        />

        <div className="space-y-5">
          <TestCaseNav />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Load existing test case to update
                </span>
                <select
                  value={editingCaseId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    if (!nextId) {
                      resetForm(false);
                      return;
                    }

                    const selectedCase = existingCases.find((item) => item.id === nextId);
                    if (selectedCase) {
                      loadCaseIntoForm(selectedCase);
                    }
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">Create new test case</option>
                  {existingCases.map((testCase) => (
                    <option key={testCase.id} value={testCase.id}>
                      {testCase.reference_code} • {testCase.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current mode
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isEditing ? "Editing existing case" : "Create and continue"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Use `Save & Add Another` to keep entering multiple cases without leaving this page.
                </p>
              </div>
            </div>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {loadingOptions ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              Loading test case form options...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <section className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Authoring flow
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        {isEditing ? "Update an existing case" : "Build reusable case records faster"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Fill the core details, define execution steps, and keep saving new cases in the same flow.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {completionItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <SprintTabs
                  items={[
                    {
                      key: "details",
                      label: "Details",
                      icon: "checklist",
                      description: "Project, sprint, suite, and case settings",
                    },
                    {
                      key: "steps",
                      label: "Steps",
                      icon: "format_list_numbered",
                      description: "Actions and expected results",
                    },
                    {
                      key: "links",
                      label: "Links",
                      icon: "device_hub",
                      description: "Attach delivery records and story references",
                    },
                  ]}
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as CreateTab)}
                />

                {activeTab === "details" ? (
                  <CreateTestCaseDetailsTab
                    title={title}
                    projectId={projectId}
                    sprintName={sprintName}
                    isCreatingSprint={isCreatingSprint}
                    sprintPreviewName={sprintPreviewName}
                    suite={suite}
                    module={module}
                    priority={priority}
                    automation={automation}
                    status={status}
                    preconditionsInput={preconditionsInput}
                    tagsInput={tagsInput}
                    projects={projects}
                    sprintOptions={filteredSprints}
                    suiteOptions={suiteOptions}
                    moduleOptions={moduleOptions.filter(
                      (item) => !projectId || item.project_id === projectId,
                    )}
                    validStepCount={validSteps.length}
                    totalStepCount={steps.length}
                    onTitleChange={setTitle}
                    onProjectChange={setProjectId}
                    onSprintNameChange={setSprintName}
                    onSprintCreateModeChange={setIsCreatingSprint}
                    onSuiteChange={setSuite}
                    onModuleChange={setModule}
                    onPriorityChange={setPriority}
                    onAutomationChange={setAutomation}
                    onStatusChange={setStatus}
                    onPreconditionsChange={setPreconditionsInput}
                    onTagsChange={setTagsInput}
                  />
                ) : null}

                {activeTab === "steps" ? (
                  <CreateTestCaseStepsTab
                    steps={steps}
                    onStepChange={handleStepChange}
                    onAddStep={handleAddStep}
                    onRemoveStep={handleRemoveStep}
                  />
                ) : null}

                {activeTab === "links" ? (
                  <CreateTestCaseLinksTab
                    linkedTaskId={linkedTaskId}
                    linkedStoryId={linkedStoryId}
                    linkedStoryTitle={linkedStoryTitle}
                    taskOptions={filteredTasks}
                    onLinkedTaskChange={setLinkedTaskId}
                    onLinkedStoryIdChange={setLinkedStoryId}
                    onLinkedStoryTitleChange={setLinkedStoryTitle}
                  />
                ) : null}
              </section>

              <div className="xl:sticky xl:top-6 xl:self-start">
                <CreateTestCaseReviewPanel
                  ownerName={user?.full_name || "Current user"}
                  projectName={selectedProject?.name || ""}
                  sprintName={sprintName}
                  linkedTaskTitle={selectedTask?.title || ""}
                  suite={suite}
                  module={module}
                  tagsCount={tagsInput
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean).length}
                  validSteps={validSteps}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
