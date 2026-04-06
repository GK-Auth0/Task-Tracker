import type { TestAutomation, TestCasePriority, TestCaseStatus } from "../../../types/testCase";
import type {
  TestCaseFormProjectOption,
  TestCaseFormSprintOption,
  TestCaseModuleOption,
  TestCaseSuiteOption,
} from "../../../services/testCases";

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";
const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white";

interface CreateTestCaseDetailsTabProps {
  title: string;
  projectId: string;
  sprintName: string;
  isCreatingSprint: boolean;
  sprintPreviewName: string;
  suite: string;
  suiteOptions: TestCaseSuiteOption[];
  module: string;
  priority: TestCasePriority;
  automation: TestAutomation;
  status: TestCaseStatus;
  preconditionsInput: string;
  tagsInput: string;
  projects: TestCaseFormProjectOption[];
  sprintOptions: TestCaseFormSprintOption[];
  moduleOptions: TestCaseModuleOption[];
  isCreatingModule: boolean;
  validStepCount: number;
  totalStepCount: number;
  onTitleChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onSprintNameChange: (value: string) => void;
  onSprintCreateModeChange: (value: boolean) => void;
  onSuiteChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onModuleCreateModeChange: (value: boolean) => void;
  onPriorityChange: (value: TestCasePriority) => void;
  onAutomationChange: (value: TestAutomation) => void;
  onStatusChange: (value: TestCaseStatus) => void;
  onPreconditionsChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

const priorityOptions: TestCasePriority[] = ["Critical", "High", "Medium", "Low"];
const automationOptions: TestAutomation[] = ["Manual", "Automated", "Candidate"];
const statusOptions: TestCaseStatus[] = ["Draft", "Ready", "Blocked", "Passed", "Failed"];
const CUSTOM_VALUE = "__custom__";

export default function CreateTestCaseDetailsTab({
  title,
  projectId,
  sprintName,
  isCreatingSprint,
  sprintPreviewName,
  suite,
  suiteOptions,
  module,
  priority,
  automation,
  status,
  preconditionsInput,
  tagsInput,
  projects,
  sprintOptions,
  moduleOptions,
  isCreatingModule,
  validStepCount,
  totalStepCount,
  onTitleChange,
  onProjectChange,
  onSprintNameChange,
  onSprintCreateModeChange,
  onSuiteChange,
  onModuleChange,
  onModuleCreateModeChange,
  onPriorityChange,
  onAutomationChange,
  onStatusChange,
  onPreconditionsChange,
  onTagsChange,
}: CreateTestCaseDetailsTabProps) {
  const moduleSelectValue = isCreatingModule ? CUSTOM_VALUE : module;
  const sprintSelectValue = isCreatingSprint ? CUSTOM_VALUE : sprintName;
  const suiteSelectValue =
    !suite || suiteOptions.some((item) => item.name === suite) ? suite : CUSTOM_VALUE;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Case details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pick the project context first, then fill in structured metadata.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div>
              <p className={fieldLabelClass}>Projects</p>
              <p className="mt-1 font-semibold text-slate-900">{projects.length}</p>
            </div>
            <div>
              <p className={fieldLabelClass}>Ready steps</p>
              <p className="mt-1 font-semibold text-slate-900">
                {validStepCount}/{totalStepCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={fieldLabelClass}>Title</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className={fieldClass}
              placeholder="Describe the reusable test case"
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Project</span>
            <select
              value={projectId}
              onChange={(event) => onProjectChange(event.target.value)}
              className={fieldClass}
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
            <span className={fieldLabelClass}>Sprint</span>
            <select
              value={sprintSelectValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_VALUE) {
                  onSprintCreateModeChange(true);
                  return;
                }

                onSprintCreateModeChange(false);
                onSprintNameChange(nextValue);
              }}
              className={fieldClass}
            >
              <option value="">No sprint</option>
              {sprintOptions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name} ({item.status})
                </option>
              ))}
              <option value={CUSTOM_VALUE}>Create new sprint</option>
            </select>
            {isCreatingSprint ? (
              <p className="mt-2 text-xs text-slate-500">
                New sprint will be created automatically as <span className="font-semibold text-slate-700">{sprintPreviewName}</span>.
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Suite</span>
            <select
              value={suiteSelectValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_VALUE) {
                  onSuiteChange("");
                  return;
                }

                onSuiteChange(nextValue);
              }}
              className={fieldClass}
            >
              <option value="">Select suite</option>
              {suiteOptions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
              <option value={CUSTOM_VALUE}>Create new suite</option>
            </select>
            {suiteSelectValue === CUSTOM_VALUE ? (
              <input
                value={suite}
                onChange={(event) => onSuiteChange(event.target.value)}
                className={fieldClass}
                placeholder="Authentication"
              />
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Suite options are loaded from the suite catalog and existing test cases.
            </p>
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Module</span>
            <select
              value={moduleSelectValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_VALUE) {
                  onModuleCreateModeChange(true);
                  onModuleChange("");
                  return;
                }

                onModuleCreateModeChange(false);
                onModuleChange(nextValue);
              }}
              className={fieldClass}
            >
              <option value="">Select module</option>
              {moduleOptions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
              <option value={CUSTOM_VALUE}>Create new module</option>
            </select>
          </label>

          {isCreatingModule ? (
            <label className="block">
              <span className={fieldLabelClass}>New module name</span>
              <input
                value={module}
                onChange={(event) => onModuleChange(event.target.value)}
                className={fieldClass}
                placeholder="Password Reset"
              />
            </label>
          ) : null}

          <label className="block">
            <span className={fieldLabelClass}>Priority</span>
            <select
              value={priority}
              onChange={(event) => onPriorityChange(event.target.value as TestCasePriority)}
              className={fieldClass}
            >
              {priorityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Automation</span>
            <select
              value={automation}
              onChange={(event) => onAutomationChange(event.target.value as TestAutomation)}
              className={fieldClass}
            >
              {automationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:max-w-[240px]">
            <span className={fieldLabelClass}>Status</span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as TestCaseStatus)}
              className={fieldClass}
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Coverage notes</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block">
            <span className={fieldLabelClass}>Preconditions</span>
            <textarea
              rows={6}
              value={preconditionsInput}
              onChange={(event) => onPreconditionsChange(event.target.value)}
              className={fieldClass}
              placeholder={"Add one precondition per line\nA user account exists\nEmail auth is enabled"}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Tags</span>
            <textarea
              rows={6}
              value={tagsInput}
              onChange={(event) => onTagsChange(event.target.value)}
              className={fieldClass}
              placeholder={"Comma-separated labels\nregression, security, api"}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
