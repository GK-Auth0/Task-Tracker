import type { TestAutomation, TestCaseStatus } from "../../types/testCase";

interface TestCaseFiltersBarProps {
  query: string;
  statusFilter: "All" | TestCaseStatus;
  automationFilter: "All" | TestAutomation;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "All" | TestCaseStatus) => void;
  onAutomationChange: (value: "All" | TestAutomation) => void;
}

export default function TestCaseFiltersBar({
  query,
  statusFilter,
  automationFilter,
  onQueryChange,
  onStatusChange,
  onAutomationChange,
}: TestCaseFiltersBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            search
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by ID, title, suite, or module"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value as "All" | TestCaseStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            {["All", "Draft", "Ready", "Blocked", "Passed", "Failed"].map((option) => (
              <option key={option} value={option}>
                Status: {option}
              </option>
            ))}
          </select>

          <select
            value={automationFilter}
            onChange={(event) =>
              onAutomationChange(event.target.value as "All" | TestAutomation)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            {["All", "Manual", "Automated", "Candidate"].map((option) => (
              <option key={option} value={option}>
                Automation: {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
