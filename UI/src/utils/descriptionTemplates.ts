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
    `Overview: ${projectName}`,
    "",
    "Problem Statement:",
    "- What problem are we solving?",
    "",
    "Goals:",
    "1. [Primary business/technical goal]",
    "2. [Secondary goal]",
    "",
    "Success Metrics:",
    "- KPI 1:",
    "- KPI 2:",
    "",
    "Scope:",
    "- In scope:",
    "- Out of scope:",
    "",
    "Milestones:",
    "1. Planning",
    "2. Build",
    "3. QA + Launch",
    "",
    "Stakeholders:",
    "- Owner:",
    "- Team:",
    "",
    "Risks & Mitigation:",
    "- Risk:",
    "- Mitigation:",
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
