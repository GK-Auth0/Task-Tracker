import { NavLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import StaticDataBanner from "../components/StaticDataBanner";
import {
  DEFECT_PROJECTS,
  DEFECT_SPRINTS,
  DEFECT_TASKS,
  DEFECTS,
  qaSectionLinks,
} from "../data/testManagement";

export default function TestDefects() {
  const navigate = useNavigate();
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [sprintFilter, setSprintFilter] = useState("All Sprints");
  const [taskFilter, setTaskFilter] = useState("All Tasks");

  const visibleDefects = useMemo(() => {
    return DEFECTS.filter((defect) => {
      const matchesProject =
        projectFilter === "All Projects" || defect.project === projectFilter;
      const matchesSprint =
        sprintFilter === "All Sprints" || defect.sprint === sprintFilter;
      const matchesTask = taskFilter === "All Tasks" || defect.task === taskFilter;
      return matchesProject && matchesSprint && matchesTask;
    });
  }, [projectFilter, sprintFilter, taskFilter]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Defects
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Review bugs discovered during test execution and keep them linked to
              the exact case and run where they were found.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StaticDataBanner />
            <button
              onClick={() => navigate("/test-defects/raise")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              <span className="material-symbols-outlined text-lg">bug_report</span>
              <span>Raise Defect</span>
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {DEFECT_PROJECTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {["All Tasks", ...DEFECT_TASKS].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={sprintFilter}
              onChange={(event) => setSprintFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {DEFECT_SPRINTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[110px_minmax(220px,1.35fr)_130px_150px_120px_100px_100px_90px_90px_120px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span>ID</span>
            <span>Defect</span>
            <span>Project</span>
            <span>Task</span>
            <span>Sprint</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Run</span>
            <span>Case</span>
            <span>Owner</span>
          </div>
          <div className="divide-y divide-slate-100">
            {visibleDefects.map((defect) => (
              <div
                key={defect.id}
                className="grid grid-cols-[110px_minmax(220px,1.35fr)_130px_150px_120px_100px_100px_90px_90px_120px] gap-4 px-4 py-4"
              >
                <div className="text-sm font-semibold text-slate-900">{defect.id}</div>
                <div className="text-sm text-slate-700">{defect.title}</div>
                <div className="text-sm text-slate-600">{defect.project}</div>
                <div className="text-sm text-slate-600">{defect.task}</div>
                <div className="text-sm text-slate-600">{defect.sprint}</div>
                <div className="text-sm text-slate-600">{defect.severity}</div>
                <div>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {defect.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{defect.linkedRun}</div>
                <div className="text-sm text-slate-600">{defect.linkedCase}</div>
                <div className="text-sm text-slate-600">{defect.owner}</div>
              </div>
            ))}
            {!visibleDefects.length && (
              <div className="px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-900">
                  No defects match the selected project or sprint filters.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try another project, task, or sprint to broaden the list.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
