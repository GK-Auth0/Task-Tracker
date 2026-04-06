import type { TestStep } from "../../../types/testCase";

interface CreateTestCaseStepsTabProps {
  steps: TestStep[];
  onStepChange: (id: number, field: "action" | "expected", value: string) => void;
  onAddStep: () => void;
  onRemoveStep: (id: number) => void;
}

export default function CreateTestCaseStepsTab({
  steps,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: CreateTestCaseStepsTabProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Test steps</h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep each step focused on one action and one expected outcome.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddStep}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Add step
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
                  {step.id}
                </div>
                <p className="text-sm font-semibold text-slate-900">Step {step.id}</p>
              </div>
              {steps.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemoveStep(step.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Action
                </span>
                <textarea
                  rows={4}
                  value={step.action}
                  onChange={(event) => onStepChange(step.id, "action", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                  placeholder="Open the password reset screen and submit a valid email"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Expected result
                </span>
                <textarea
                  rows={4}
                  value={step.expected}
                  onChange={(event) => onStepChange(step.id, "expected", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                  placeholder="A success message appears and the reset email is queued"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
