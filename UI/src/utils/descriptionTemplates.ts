export interface TaskTemplateSuggestion {
  priority: "Low" | "Medium" | "High";
  reason: string;
  checklist: string[];
}

const MAX_TASK_CHECKLIST_ITEMS = 5;

const normalizeTitle = (value: string, fallback: string) => {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
};

export const buildTaskTemplate = (title: string) => {
  const taskTitle = normalizeTitle(title, "[Task Name]");
  return [
    `Objective: ${taskTitle}`,
    "",
    "Context:",
    "- Why this task matters",
    "- Related project/module",
    "",
    "Scope:",
    "- In scope:",
    "- Out of scope:",
    "",
    "Acceptance Criteria:",
    "1. [Expected behavior/result]",
    "2. [Validation or test condition]",
    "",
    "Checklist:",
    "- [ ] Implement",
    "- [ ] Test",
    "- [ ] Update docs",
    "",
    "Dependencies:",
    "- None",
    "",
    "Risks/Notes:",
    "- None",
  ].join("\n");
};

export const buildProjectTemplate = (name: string) => {
  const projectName = normalizeTitle(name, "[Project Name]");
  return [
    "## Overview",
    projectName,
    "",
    "## Problem Statement",
    "[What problem are we solving?]",
    "",
    "## Goals",
    "- [Primary business/technical goal]",
    "- [Secondary goal]",
    "",
    "## Success Metrics",
    "- [Target metric 1]",
    "- [Target metric 2]",
    "",
    "## Scope",
    "### In Scope",
    "- [List what is included]",
    "",
    "### Out of Scope",
    "- [List what is excluded]",
    "",
    "## Milestones",
    "- Planning",
    "- Build",
    "- QA + Launch",
    "",
    "## Stakeholders",
    "### Owner",
    "[Name or role]",
    "",
    "### Team",
    "- [Functions or team names]",
    "",
    "## Risks & Mitigation",
    "### Risks",
    "- [Potential risk]",
    "",
    "### Mitigation",
    "- [How we will reduce it]",
  ].join("\n");
};

export const appendTaskAiDraft = (
  current: string,
  title: string,
  suggestion: TaskTemplateSuggestion,
) => {
  const safeTitle = normalizeTitle(title, "[Task Name]");
  const checklist = suggestion.checklist
    .slice(0, MAX_TASK_CHECKLIST_ITEMS)
    .map((item) => `- [ ] ${item}`)
    .join("\n");

  const aiBlock = [
    "AI Draft",
    `Objective: ${safeTitle}`,
    `Suggested Priority: ${suggestion.priority}`,
    `Reasoning: ${suggestion.reason}`,
    "",
    "Checklist:",
    checklist || "- [ ] Define implementation approach",
  ].join("\n");

  const base = String(current || "").trim();
  return base ? `${base}\n\n---\n${aiBlock}` : aiBlock;
};
