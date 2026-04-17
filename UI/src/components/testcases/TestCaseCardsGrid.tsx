import { automationClasses, statusClasses } from "../../data/testManagement";
import type { TestCaseRecord } from "../../types/testCase";
import { getFullName } from "../../utils/user";

interface TestCaseCardsGridProps {
  items: TestCaseRecord[];
  selectedCaseId: string;
  loading: boolean;
  onSelect: (id: string) => void;
}

export default function TestCaseCardsGrid({
  items,
  selectedCaseId,
  loading,
  onSelect,
}: TestCaseCardsGridProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Loading test cases...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-semibold text-slate-900">
          No test cases match the current filters.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Try another status, suite, or search phrase to broaden the result.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {items.map((testCase) => {
        const active = selectedCaseId === testCase.id;
        return (
          <button
            key={testCase.id}
            type="button"
            onClick={() => onSelect(testCase.id)}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? "border-blue-300 bg-blue-50/60 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {testCase.reference_code}
                </p>
                <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                  {testCase.title}
                </h3>
              </div>
              <span
                className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[testCase.status]}`}
              >
                {testCase.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {testCase.suite}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {testCase.module}
              </span>
              <span
                className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${automationClasses[testCase.automation]}`}
              >
                {testCase.automation}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Owner
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {getFullName(testCase.owner)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Steps
                </p>
                <p className="mt-1 font-medium text-slate-800">{testCase.steps.length}</p>
              </div>
            </div>

            {testCase.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {testCase.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
                {testCase.tags.length > 4 ? (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                    +{testCase.tags.length - 4} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
