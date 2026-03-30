import { useState } from "react";
import {
  SPRINT_CREATE_CONTEXT,
  SPRINT_DEV_BOARD,
  SPRINT_MONITORING_BOARD,
  SPRINT_PLANNING_BOARD,
  SPRINT_QA_BOARD,
  SPRINT_WORKSPACE_OVERVIEW,
} from "../data/testManagement";
import SprintStatStrip from "../components/sprint/SprintStatStrip";
import SprintTabs from "../components/sprint/SprintTabs";
import WorkspacePageHeader from "../components/WorkspacePageHeader";

type MainTab = "planning" | "boards" | "monitoring" | "create";
type PlanningTab = "goals" | "scope" | "ceremonies";
type BoardTab = "dev" | "qa";
type MonitoringTab = "health" | "risks";

type SprintDraft = {
  name: string;
  goal: string;
  release: string;
  squad: string;
  owner: string;
  capacity: string;
  startDate: string;
  endDate: string;
};

const mainTabs: Array<{
  key: MainTab;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    key: "planning",
    label: "Planning",
    icon: "strategy",
    description: "Goals, scope, and cadence",
  },
  {
    key: "boards",
    label: "Boards",
    icon: "view_kanban",
    description: "Dev and QA flow",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    icon: "monitoring",
    description: "Health and blockers",
  },
  {
    key: "create",
    label: "Create",
    icon: "post_add",
    description: "Draft next sprint",
  },
];

const planningTabs = [
  { key: "goals", label: "Goals" },
  { key: "scope", label: "Scope" },
  { key: "ceremonies", label: "Ceremonies" },
] as const;

const boardTabs = [
  { key: "dev", label: "Dev Board" },
  { key: "qa", label: "QA Board" },
] as const;

const monitoringTabs = [
  { key: "health", label: "Health" },
  { key: "risks", label: "Risks" },
] as const;

const defaultDraft: SprintDraft = {
  name: "Sprint 25",
  goal: "Finish release validation and close remaining blocker defects",
  release: SPRINT_CREATE_CONTEXT.releaseOptions[0],
  squad: SPRINT_CREATE_CONTEXT.squadOptions[4],
  owner: SPRINT_CREATE_CONTEXT.owners[0],
  capacity: "44",
  startDate: "2026-04-06",
  endDate: "2026-04-17",
};

const riskTone = (status: string) => {
  if (status === "Healthy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Watch") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

function SectionCard({
  eyebrow,
  title,
  badge,
  children,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {badge ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function SprintBoards() {
  const [activeTab, setActiveTab] = useState<MainTab>("planning");
  const [planningTab, setPlanningTab] = useState<PlanningTab>("goals");
  const [boardTab, setBoardTab] = useState<BoardTab>("dev");
  const [monitoringTab, setMonitoringTab] = useState<MonitoringTab>("health");
  const [draft, setDraft] = useState<SprintDraft>(defaultDraft);

  const updateDraft = (field: keyof SprintDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Sprint Workspace"
          title="Sprint Planning and Delivery"
          description="A cleaner sprint workspace with smaller text, clearer tabs, and one focused action area at a time."
          metaLabel="Active sprint"
          metaValue={`${SPRINT_QA_BOARD.sprint} • ${SPRINT_QA_BOARD.release}`}
        />

        <div className="mb-5">
          <SprintStatStrip items={SPRINT_WORKSPACE_OVERVIEW} />
        </div>

        <div className="mb-5">
          <SprintTabs items={mainTabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "planning" && (
          <div className="space-y-4">
            <SprintTabs
              items={planningTabs.map((item) => ({ ...item }))}
              value={planningTab}
              onChange={setPlanningTab}
              compact
            />

            {planningTab === "goals" && (
              <SectionCard
                eyebrow="Planning"
                title="Sprint goals"
                badge={SPRINT_DEV_BOARD.sprint}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.focusAreas.map((area) => (
                    <div
                      key={area.title}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="material-symbols-outlined rounded-lg bg-white p-1.5 text-[18px] text-blue-600">
                        {area.icon}
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-slate-900">
                        {area.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {area.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {planningTab === "scope" && (
              <SectionCard
                eyebrow="Planning"
                title="Scope breakdown"
                badge={SPRINT_DEV_BOARD.goal}
              >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.swimlanes.map((lane) => (
                    <div
                      key={lane.title}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lane.tone}`}
                        >
                          {lane.items.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        {lane.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {item.id}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {item.title}
                                </p>
                              </div>
                              <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-semibold text-slate-600">
                                {item.points}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {planningTab === "ceremonies" && (
              <SectionCard
                eyebrow="Planning"
                title="Sprint ceremonies"
                badge="Schedule"
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.ceremonies.map((ceremony) => (
                    <div
                      key={ceremony.name}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{ceremony.name}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {ceremony.when}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {ceremony.agenda}
                      </p>
                      <p className="mt-3 text-[11px] text-slate-500">
                        Owner: {ceremony.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === "boards" && (
          <div className="space-y-4">
            <SprintTabs
              items={boardTabs.map((item) => ({ ...item }))}
              value={boardTab}
              onChange={setBoardTab}
              compact
            />

            {boardTab === "dev" && (
              <div className="space-y-4">
                <SprintStatStrip items={SPRINT_DEV_BOARD.summary} />
                <SectionCard
                  eyebrow="Boards"
                  title="Development board"
                  badge={`${SPRINT_DEV_BOARD.sprint} • ${SPRINT_DEV_BOARD.release}`}
                >
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    {SPRINT_DEV_BOARD.lanes.map((lane) => (
                      <div
                        key={lane.title}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                        <div className="mt-3 space-y-2.5">
                          {lane.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                            >
                              <p className="text-xs font-semibold text-slate-900">{item.id}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {item.title}
                              </p>
                              <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                <p>Owner: {item.owner}</p>
                                <p>Estimate: {item.estimate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {boardTab === "qa" && (
              <div className="space-y-4">
                <SprintStatStrip items={SPRINT_QA_BOARD.summary} />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <SectionCard
                    eyebrow="Boards"
                    title="Handoff queue"
                    badge={SPRINT_QA_BOARD.project}
                  >
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      {SPRINT_QA_BOARD.developmentLanes.map((lane) => (
                        <div
                          key={lane.title}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                          <div className="mt-3 space-y-2.5">
                            {lane.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <p className="text-xs font-semibold text-slate-900">
                                  {item.id}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {item.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard
                    eyebrow="Boards"
                    title="QA execution"
                    badge={SPRINT_QA_BOARD.release}
                  >
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {SPRINT_QA_BOARD.qaLanes.map((lane) => (
                        <div
                          key={lane.title}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                          <div className="mt-3 space-y-2.5">
                            {lane.items.map((item) => (
                              <div
                                key={`${lane.title}-${item.id}-${item.result}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <p className="text-xs font-semibold text-slate-900">
                                  {item.id}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {item.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="space-y-4">
            <SprintTabs
              items={monitoringTabs.map((item) => ({ ...item }))}
              value={monitoringTab}
              onChange={setMonitoringTab}
              compact
            />

            {monitoringTab === "health" && (
              <div className="space-y-4">
                <SprintStatStrip items={SPRINT_MONITORING_BOARD.stats} />
                <SectionCard
                  eyebrow="Monitoring"
                  title="Sprint health checks"
                  badge={`Updated for ${SPRINT_QA_BOARD.sprint}`}
                >
                  <div className="space-y-3">
                    {SPRINT_MONITORING_BOARD.checkpoints.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskTone(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {monitoringTab === "risks" && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <SectionCard eyebrow="Monitoring" title="Open incidents" badge="Blockers">
                  <div className="space-y-3">
                    {SPRINT_MONITORING_BOARD.incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {incident.id}
                          </p>
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                            {incident.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {incident.title}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {incident.owner} • {incident.eta}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard eyebrow="Monitoring" title="Team pulse" badge="Teams">
                  <div className="space-y-3">
                    {SPRINT_MONITORING_BOARD.teamPulse.map((team) => (
                      <div
                        key={team.name}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${team.tone}`}
                          >
                            Active
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {team.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <SectionCard eyebrow="Create" title="Templates" badge="Start here">
              <div className="space-y-3">
                {SPRINT_CREATE_CONTEXT.templates.map((template) => (
                  <div
                    key={template.name}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      {template.focus}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Capacity: {template.capacity}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Create" title="Sprint form" badge="Draft next sprint">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Sprint name</span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft("name", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Release</span>
                  <select
                    value={draft.release}
                    onChange={(e) => updateDraft("release", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {SPRINT_CREATE_CONTEXT.releaseOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Owner</span>
                  <select
                    value={draft.owner}
                    onChange={(e) => updateDraft("owner", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {SPRINT_CREATE_CONTEXT.owners.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Squad</span>
                  <select
                    value={draft.squad}
                    onChange={(e) => updateDraft("squad", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {SPRINT_CREATE_CONTEXT.squadOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Start date</span>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => updateDraft("startDate", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">End date</span>
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => updateDraft("endDate", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:max-w-[220px]">
                  <span className="text-xs font-medium text-slate-700">Capacity</span>
                  <input
                    type="number"
                    min="1"
                    value={draft.capacity}
                    onChange={(e) => updateDraft("capacity", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Sprint goal</span>
                  <textarea
                    value={draft.goal}
                    onChange={(e) => updateDraft("goal", e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                    Preview
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{draft.name}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{draft.goal}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {draft.owner} • {draft.squad} • {draft.capacity} pts
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
