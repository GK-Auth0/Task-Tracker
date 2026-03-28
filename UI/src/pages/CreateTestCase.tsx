import { NavLink } from "react-router-dom";
import { TEST_CASE_CREATE_CONTEXT, qaSectionLinks } from "../data/testManagement";
import StaticDataBanner from "../components/StaticDataBanner";

export default function CreateTestCase() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Create Test Case
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Create a reusable test case with linked project, task, sprint, and
              requirement context.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StaticDataBanner />
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
              <span className="material-symbols-outlined text-lg">save</span>
              <span>Save Test Case</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 mb-6">
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Case details</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Title
                  </span>
                  <input
                    defaultValue="Password reset link expires after configured time window"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Project
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.projectOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sprint
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.sprintOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Suite
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.suiteOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Module
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.moduleOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Priority
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.priorityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Automation
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {TEST_CASE_CREATE_CONTEXT.automationOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block mt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Preconditions
                </span>
                <textarea
                  rows={4}
                  defaultValue="A password reset token is available and the configured expiry time has elapsed."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Test steps</h2>
              <div className="mt-4 space-y-3">
                {TEST_CASE_CREATE_CONTEXT.sampleSteps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{step.action}</p>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">Expected:</span>{" "}
                      {step.expected}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Linked delivery context</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Task:</span>{" "}
                  {TEST_CASE_CREATE_CONTEXT.linkedTask}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Story:</span>{" "}
                  {TEST_CASE_CREATE_CONTEXT.linkedStory}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Suggested tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {["regression", "security", "negative", "api"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
