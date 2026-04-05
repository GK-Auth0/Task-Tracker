import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  type TestCaseFormProjectOption,
  type TestCaseFormSprintOption,
  type TestCaseModuleOption,
  type TestCaseFormTaskOption,
} from "../services/testCases";
import { sprintsAPI } from "../services/sprints";
import type { TestAutomation, TestCasePriority, TestCaseStatus, TestStep } from "../types/testCase";

type CreateTab = "details" | "steps" | "links";

export default function CreateTestCase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<TestCaseFormProjectOption[]>([]);
  const [tasks, setTasks] = useState<TestCaseFormTaskOption[]>([]);
  const [sprints, setSprints] = useState<TestCaseFormSprintOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<TestCaseModuleOption[]>([]);

  const [activeTab, setActiveTab] = useState<CreateTab>("details");
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sprintName, setSprintName] = useState("");
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [suite, setSuite] = useState("");
  const [module, setModule] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
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

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const response = await testCasesAPI.getFormOptions(
          projectId ? { project_id: projectId } : undefined,
        );
        const modulesResponse = await testCaseModulesAPI.getModules(
          projectId ? { project_id: projectId } : undefined,
        );

        if (response.success) {
          setProjects(response.data.projects);
          setTasks(response.data.tasks);
          setSprints(response.data.sprints);

          if (!projectId && response.data.projects.length === 1) {
            setProjectId(response.data.projects[0].id);
          }
        }

        if (modulesResponse.success) {
          setModuleOptions(modulesResponse.data);
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

  useEffect(() => {
    if (!isCreatingModule) return;

    const projectModules = moduleOptions.filter((item) => !projectId || item.project_id === projectId);
    if (module && projectModules.some((item) => item.name === module)) {
      setIsCreatingModule(false);
    }
  }, [isCreatingModule, module, moduleOptions, projectId]);

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
          setSprintName(createdSprintResponse.data.name);
          setSprints((current) =>
            [...current, createdSprintResponse.data].sort((left, right) =>
              left.name.localeCompare(right.name),
            ),
          );
        }
      } else if (existingSprint) {
        resolvedSprintName = existingSprint.name;
      }

      const existingModule = moduleOptions.find(
        (item) =>
          item.project_id === projectId &&
          item.name.trim().toLowerCase() === module.trim().toLowerCase(),
      );

      if (!existingModule && module.trim()) {
        const createdModuleResponse = await testCaseModulesAPI.createModule({
          name: module.trim(),
          project_id: projectId,
        });

        if (createdModuleResponse.success) {
          setModuleOptions((current) => {
            if (current.some((item) => item.id === createdModuleResponse.data.id)) {
              return current;
            }
            return [...current, createdModuleResponse.data].sort((left, right) =>
              left.name.localeCompare(right.name),
            );
          });
        }
      }

      await testCasesAPI.createTestCase({
        title: title.trim(),
        project_id: projectId,
        linked_task_id: linkedTaskId || undefined,
        suite: suite.trim(),
        module: module.trim(),
        sprint_name: resolvedSprintName || undefined,
        priority,
        status,
        automation,
        tags: parsedTags,
        preconditions: parsedPreconditions,
        steps: validSteps,
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

  const headerScope = selectedProject
    ? `${selectedProject.name}${sprintName ? ` • ${sprintName}` : ""}`
    : "Choose project and sprint";

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <CreateTestCaseHeader
          metaValue={headerScope}
          submitting={submitting}
          onSave={handleSubmit}
        />

        <div className="space-y-5">
          <TestCaseNav />

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          {loadingOptions ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              Loading test case form options...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]">
              <section className="space-y-5">
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
                    moduleOptions={moduleOptions.filter(
                      (item) => !projectId || item.project_id === projectId,
                    )}
                    isCreatingModule={isCreatingModule}
                    validStepCount={validSteps.length}
                    totalStepCount={steps.length}
                    onTitleChange={setTitle}
                    onProjectChange={setProjectId}
                    onSprintNameChange={setSprintName}
                    onSprintCreateModeChange={setIsCreatingSprint}
                    onSuiteChange={setSuite}
                    onModuleChange={setModule}
                    onModuleCreateModeChange={setIsCreatingModule}
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
          )}
        </div>
      </div>
    </div>
  );
}
