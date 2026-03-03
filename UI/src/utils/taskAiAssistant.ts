export interface TaskAiSuggestion {
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  checklist: string[];
  reason: string;
}

const HIGH_URGENCY_KEYWORDS = [
  "urgent",
  "asap",
  "critical",
  "blocker",
  "production",
  "outage",
  "hotfix",
  "security",
];

const MEDIUM_URGENCY_KEYWORDS = [
  "review",
  "follow up",
  "follow-up",
  "prepare",
  "update",
  "refactor",
  "meeting",
];

const normalizeText = (title: string, description: string) =>
  `${title} ${description}`.toLowerCase();

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

export const getTaskAiSuggestion = (
  title: string,
  description: string,
): TaskAiSuggestion => {
  const text = normalizeText(title, description);

  let score = 0;
  for (const keyword of HIGH_URGENCY_KEYWORDS) {
    if (text.includes(keyword)) score += 2;
  }
  for (const keyword of MEDIUM_URGENCY_KEYWORDS) {
    if (text.includes(keyword)) score += 1;
  }

  const hasImmediateDateWords =
    text.includes("today") || text.includes("tomorrow") || text.includes("this week");
  if (hasImmediateDateWords) score += 1;

  const priority: "Low" | "Medium" | "High" =
    score >= 3 ? "High" : score >= 1 ? "Medium" : "Low";

  let dueDate: string | null = null;
  if (text.includes("today")) dueDate = addDays(0);
  else if (text.includes("tomorrow")) dueDate = addDays(1);
  else if (text.includes("this week")) dueDate = addDays(5);
  else if (priority === "High") dueDate = addDays(2);
  else if (priority === "Medium") dueDate = addDays(5);
  else dueDate = addDays(10);

  const checklist = [
    "Clarify acceptance criteria",
    "Complete implementation",
    "Review and verify output",
  ];

  const reason =
    priority === "High"
      ? "Detected urgency keywords or immediate timeline."
      : priority === "Medium"
        ? "Task appears moderately time-sensitive."
        : "Task appears routine with lower urgency.";

  return {
    priority,
    dueDate,
    checklist,
    reason,
  };
};
