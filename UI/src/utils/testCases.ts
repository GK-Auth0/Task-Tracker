import type { TestCaseRecord } from "../types/testCase";

export const encodeModuleSlug = (moduleName: string) => encodeURIComponent(moduleName);

export const decodeModuleSlug = (moduleSlug: string) => decodeURIComponent(moduleSlug);

export const formatTestCaseDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently updated";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

export const groupTestCasesByModule = (testCases: TestCaseRecord[]) => {
  const grouped = new Map<string, TestCaseRecord[]>();

  testCases.forEach((testCase) => {
    const key = testCase.module || "Unassigned Module";
    grouped.set(key, [...(grouped.get(key) || []), testCase]);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([module, items]) => ({
      module,
      items,
    }));
};
