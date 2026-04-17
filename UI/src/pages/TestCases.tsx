import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import TestCaseModuleGrid from "../components/testcases/TestCaseModuleGrid";
import { testCasesAPI } from "../services/testCases";
import type { TestCaseRecord } from "../types/testCase";
import {
  groupTestCasesByModule,
  groupTestCasesByProject,
  groupTestCasesByTask,
} from "../utils/testCases";

type GroupMode = "module" | "project" | "task";

export default function TestCases() {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<GroupMode>("module");

  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCases(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCases();
  }, []);

  const moduleGroups = useMemo(() => groupTestCasesByModule(testCases), [testCases]);
  const projectGroups = useMemo(() => groupTestCasesByProject(testCases), [testCases]);
  const taskGroups = useMemo(() => groupTestCasesByTask(testCases), [testCases]);
  const latestSprint =
    testCases.find((item) => item.sprint_name)?.sprint_name || "Workspace QA";

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Cases"
          description="Manage coverage by module, inspect delivery context quickly, and move from catalog to execution-ready cases without extra clicks."
          metaLabel="Active cycle"
          metaValue={latestSprint}
          showStaticBanner={false}
          actions={
            <button
              type="button"
              onClick={() => navigate("/test-cases/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              New Test Case
            </button>
          }
        />

        <div className="space-y-5">
          <TestCaseNav />
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "module" as const, label: "Group by Module", icon: "category" },
                { key: "project" as const, label: "Group by Project", icon: "folder" },
                { key: "task" as const, label: "Group by Task", icon: "checklist" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setGroupMode(option.key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                    groupMode === option.key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </section>
          {groupMode === "module" ? (
            <TestCaseModuleGrid
              items={moduleGroups}
              loading={loading}
              onOpenModule={(moduleSlug) => navigate(`/test-cases/modules/${moduleSlug}`)}
            />
          ) : null}

          {groupMode === "project" ? (
            <section className="space-y-4">
              {projectGroups.map((group) => (
                <div key={group.project} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{group.project}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.items.length} case{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {group.items[0]?.project?.id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${group.items[0]!.project!.id}`)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      >
                        Open Project
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/test-cases/case/${item.id}`)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.reference_code}</p>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{item.title}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.linked_task?.title || "No linked task"} • {item.module}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {groupMode === "task" ? (
            <section className="space-y-4">
              {taskGroups.map((group) => (
                <div key={group.task} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{group.task}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.items.length} case{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {group.linkedTaskId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/task/${group.linkedTaskId}`)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      >
                        Open Task
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/test-cases/case/${item.id}`)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.reference_code}</p>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{item.title}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.project?.name || "No project"} • {item.module}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
