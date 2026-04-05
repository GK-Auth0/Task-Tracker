import type { TestStep } from "../../../types/testCase";

interface CreateTestCaseReviewPanelProps {
  ownerName: string;
  projectName: string;
  sprintName: string;
  linkedTaskTitle: string;
  suite: string;
  module: string;
  tagsCount: number;
  validSteps: TestStep[];
}

export default function CreateTestCaseReviewPanel({
  ownerName,
  projectName,
  sprintName,
  linkedTaskTitle,
  suite,
  module,
  tagsCount,
  validSteps,
}: CreateTestCaseReviewPanelProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Review snapshot</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {[
            ["Owner", ownerName],
            ["Project", projectName || "Not selected"],
            ["Sprint", sprintName || "No sprint"],
            ["Linked task", linkedTaskTitle || "No linked task"],
            ["Suite", suite || "Not selected"],
            ["Module", module || "Not selected"],
            ["Tags", tagsCount ? `${tagsCount} selected` : "No tags added"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Valid steps</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {validSteps.length}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {validSteps.length ? (
            validSteps.map((step) => (
              <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Step {step.id}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">{step.action}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{step.expected}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
              Add at least one complete step to save this test case.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
