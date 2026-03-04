import React from "react";

export type TasksTabKey = "overview" | "board" | "timeline" | "ai";

interface TasksTabsProps {
  activeTab: TasksTabKey;
  onTabChange: (tab: TasksTabKey) => void;
}

const TasksTabs: React.FC<TasksTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{ key: TasksTabKey; label: string; icon: string }> = [
    { key: "overview", label: "Overview", icon: "view_list" },
    { key: "board", label: "Board", icon: "dashboard" },
    { key: "timeline", label: "Timeline", icon: "timeline" },
    { key: "ai", label: "AI Planner", icon: "auto_awesome" },
  ];

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default TasksTabs;
