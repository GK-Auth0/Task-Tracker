export type TestCaseStatus = "Draft" | "Ready" | "Blocked" | "Passed" | "Failed";
export type TestCasePriority = "Critical" | "High" | "Medium" | "Low";
export type TestAutomation = "Manual" | "Automated" | "Candidate";

export type TestStep = {
  id: number;
  action: string;
  expected: string;
};

export type ExecutionEntry = {
  id: string;
  cycle: string;
  status: "Passed" | "Failed" | "Blocked";
  tester: string;
  executedAt: string;
  note: string;
};

export type TestCaseRecord = {
  id: string;
  title: string;
  suite: string;
  module: string;
  owner: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  automation: TestAutomation;
  updatedAt: string;
  tags: string[];
  preconditions: string[];
  steps: TestStep[];
  linkedItems: Array<{
    id: string;
    type: "Story" | "Bug" | "Requirement";
    title: string;
  }>;
  executionHistory: ExecutionEntry[];
};

export const TEST_CASES: TestCaseRecord[] = [
  {
    id: "TC-184",
    title: "User signs in with valid email and password",
    suite: "Authentication",
    module: "Login",
    owner: "Kavin",
    priority: "Critical",
    status: "Ready",
    automation: "Automated",
    updatedAt: "2h ago",
    tags: ["smoke", "regression", "web"],
    preconditions: [
      "A registered user exists in the workspace.",
      "Email/password authentication is enabled for the tenant.",
    ],
    steps: [
      {
        id: 1,
        action: "Open the login page and enter a valid email address.",
        expected: "Email field accepts the value without validation errors.",
      },
      {
        id: 2,
        action: "Enter the correct password and click Sign in.",
        expected: "The user is authenticated and redirected to the dashboard.",
      },
      {
        id: 3,
        action: "Verify the top navigation and recent projects section.",
        expected: "Workspace navigation and user-specific widgets are visible.",
      },
    ],
    linkedItems: [
      { id: "AUTH-72", type: "Story", title: "Email login for workspace members" },
      { id: "SEC-14", type: "Requirement", title: "Secure session creation" },
    ],
    executionHistory: [
      {
        id: "EX-911",
        cycle: "Sprint 24 Regression",
        status: "Passed",
        tester: "Harini",
        executedAt: "Today, 10:20 AM",
        note: "Stable in staging and production-like environment.",
      },
      {
        id: "EX-877",
        cycle: "Release Candidate",
        status: "Passed",
        tester: "Arun",
        executedAt: "Yesterday, 5:40 PM",
        note: "No issues. Automation run matched manual check.",
      },
    ],
  },
  {
    id: "TC-201",
    title: "Password reset link expires after configured time window",
    suite: "Authentication",
    module: "Password Reset",
    owner: "Maya",
    priority: "High",
    status: "Failed",
    automation: "Candidate",
    updatedAt: "5h ago",
    tags: ["security", "negative", "api"],
    preconditions: [
      "A password reset token has been generated.",
      "Token validity duration is configured to 15 minutes.",
    ],
    steps: [
      {
        id: 1,
        action: "Request a password reset email for an existing account.",
        expected: "A reset token and email are generated successfully.",
      },
      {
        id: 2,
        action: "Wait until the token expires and open the reset link.",
        expected: "The app shows an expired token message.",
      },
      {
        id: 3,
        action: "Submit a new password using the expired token.",
        expected: "Password update is rejected and the user is prompted to retry.",
      },
    ],
    linkedItems: [
      { id: "AUTH-91", type: "Bug", title: "Expired reset link still accepted" },
      { id: "SEC-22", type: "Requirement", title: "Reset token invalidation" },
    ],
    executionHistory: [
      {
        id: "EX-902",
        cycle: "Sprint 24 Regression",
        status: "Failed",
        tester: "Neha",
        executedAt: "Today, 8:55 AM",
        note: "API accepted the token 4 minutes after expiry.",
      },
      {
        id: "EX-851",
        cycle: "Security Sweep",
        status: "Blocked",
        tester: "Dilip",
        executedAt: "2 days ago",
        note: "Mail sandbox issue prevented full validation.",
      },
    ],
  },
  {
    id: "TC-223",
    title: "Create a task with due date, assignee, and AI-generated description",
    suite: "Task Management",
    module: "Task Creation",
    owner: "Priya",
    priority: "High",
    status: "Ready",
    automation: "Manual",
    updatedAt: "1d ago",
    tags: ["core-flow", "ai", "ui"],
    preconditions: [
      "The user has permission to create tasks.",
      "AI assistant service is reachable.",
    ],
    steps: [
      {
        id: 1,
        action: "Open the create task modal from the tasks page.",
        expected: "Task creation form is displayed.",
      },
      {
        id: 2,
        action: "Enter title, assignee, due date, and use AI to generate description.",
        expected: "The form shows generated content and preserves other inputs.",
      },
      {
        id: 3,
        action: "Submit the task.",
        expected: "The task appears in the selected project with the chosen metadata.",
      },
    ],
    linkedItems: [
      { id: "TASK-188", type: "Story", title: "Rich task creation experience" },
      { id: "AI-13", type: "Requirement", title: "AI-assisted descriptions" },
    ],
    executionHistory: [
      {
        id: "EX-790",
        cycle: "Sprint 23 Demo",
        status: "Passed",
        tester: "Kavin",
        executedAt: "Last week",
        note: "Happy path is clean. Edge cases need separate coverage.",
      },
    ],
  },
  {
    id: "TC-241",
    title: "Confidential project access request is reviewed by admin",
    suite: "Projects",
    module: "Confidential Access",
    owner: "Arjun",
    priority: "Medium",
    status: "Blocked",
    automation: "Manual",
    updatedAt: "3d ago",
    tags: ["permissions", "workflow"],
    preconditions: [
      "A project is marked as confidential.",
      "A non-admin user has submitted an access request.",
    ],
    steps: [
      {
        id: 1,
        action: "Open the project and submit a confidential access request.",
        expected: "The request is recorded with the provided reason.",
      },
      {
        id: 2,
        action: "Sign in as an admin and review pending requests.",
        expected: "The pending request is visible with requester metadata.",
      },
      {
        id: 3,
        action: "Approve the request and return to the project view as the requester.",
        expected: "The user can now open restricted tabs.",
      },
    ],
    linkedItems: [
      { id: "PROJ-104", type: "Story", title: "Confidential project workflow" },
      { id: "BUG-342", type: "Bug", title: "Reviewer list not loading in staging" },
    ],
    executionHistory: [
      {
        id: "EX-743",
        cycle: "Sprint 22 Regression",
        status: "Blocked",
        tester: "Maya",
        executedAt: "3 days ago",
        note: "Admin reviewer endpoint returned 500 in staging.",
      },
    ],
  },
  {
    id: "TC-255",
    title: "Calendar displays upcoming tasks grouped by due date",
    suite: "Planning",
    module: "Calendar",
    owner: "Harini",
    priority: "Low",
    status: "Draft",
    automation: "Candidate",
    updatedAt: "4d ago",
    tags: ["calendar", "ux"],
    preconditions: [
      "At least five tasks exist across multiple dates.",
      "User has permission to view the calendar page.",
    ],
    steps: [
      {
        id: 1,
        action: "Open the calendar page in month view.",
        expected: "Current month grid renders successfully.",
      },
      {
        id: 2,
        action: "Inspect a day containing multiple tasks.",
        expected: "The count, labels, and due-date grouping are accurate.",
      },
      {
        id: 3,
        action: "Switch between month and week-level navigation.",
        expected: "Tasks remain consistent across views.",
      },
    ],
    linkedItems: [
      { id: "CAL-31", type: "Story", title: "Monthly planning calendar" },
    ],
    executionHistory: [
      {
        id: "EX-701",
        cycle: "Design QA",
        status: "Passed",
        tester: "Riya",
        executedAt: "4 days ago",
        note: "Coverage exists, but scenario still needs edge-case expansion.",
      },
    ],
  },
];

export const TEST_FOLDERS = [
  { name: "All test cases", count: TEST_CASES.length, icon: "library_books" },
  { name: "Smoke suite", count: 12, icon: "bolt" },
  { name: "Regression", count: 48, icon: "restart_alt" },
  { name: "Authentication", count: 18, icon: "lock" },
  { name: "Task management", count: 27, icon: "checklist" },
];

export const TEST_PLANS = [
  {
    id: "TP-31",
    name: "Sprint 24 Regression Plan",
    release: "Web App 2.4",
    owner: "Harini",
    cycle: "Active",
    suites: 6,
    cases: 62,
    runs: 3,
    updatedAt: "Today",
  },
  {
    id: "TP-28",
    name: "Authentication Hardening",
    release: "Security Patch",
    owner: "Maya",
    cycle: "Review",
    suites: 3,
    cases: 18,
    runs: 2,
    updatedAt: "Yesterday",
  },
  {
    id: "TP-22",
    name: "Calendar Experience Validation",
    release: "UX Refresh",
    owner: "Riya",
    cycle: "Draft",
    suites: 2,
    cases: 11,
    runs: 1,
    updatedAt: "3d ago",
  },
];

export const TEST_RUNS = [
  {
    id: "TR-84",
    name: "Sprint 24 Regression - Staging",
    planId: "TP-31",
    environment: "Staging",
    owner: "Harini",
    status: "In Progress",
    passed: 41,
    failed: 6,
    blocked: 2,
    pending: 13,
    updatedAt: "15m ago",
  },
  {
    id: "TR-79",
    name: "Authentication Security Sweep",
    planId: "TP-28",
    environment: "QA",
    owner: "Maya",
    status: "Blocked",
    passed: 9,
    failed: 2,
    blocked: 3,
    pending: 4,
    updatedAt: "2h ago",
  },
  {
    id: "TR-71",
    name: "Calendar UX Validation",
    planId: "TP-22",
    environment: "Preview",
    owner: "Riya",
    status: "Completed",
    passed: 10,
    failed: 1,
    blocked: 0,
    pending: 0,
    updatedAt: "1d ago",
  },
];

export const TEST_REPORTS = [
  {
    label: "Pass rate",
    value: "81%",
    detail: "Across the latest active runs",
    icon: "task_alt",
  },
  {
    label: "Coverage",
    value: "74%",
    detail: "Stories linked to at least one test case",
    icon: "pie_chart",
  },
  {
    label: "Open defects",
    value: "9",
    detail: "Bugs linked from failed or blocked runs",
    icon: "bug_report",
  },
  {
    label: "Ready cases",
    value: "38",
    detail: "Cases available for upcoming execution",
    icon: "fact_check",
  },
];

export const TRACEABILITY_ROWS = [
  {
    id: "REQ-18",
    requirement: "Secure email authentication",
    linkedStory: "AUTH-72",
    linkedCases: ["TC-184", "TC-201"],
    coverage: "Covered",
    latestRun: "1 failed, 1 passed",
  },
  {
    id: "REQ-24",
    requirement: "AI-assisted task authoring",
    linkedStory: "TASK-188",
    linkedCases: ["TC-223"],
    coverage: "Covered",
    latestRun: "Passed",
  },
  {
    id: "REQ-31",
    requirement: "Confidential project approvals",
    linkedStory: "PROJ-104",
    linkedCases: ["TC-241"],
    coverage: "At Risk",
    latestRun: "Blocked",
  },
  {
    id: "REQ-39",
    requirement: "Calendar month visualization",
    linkedStory: "CAL-31",
    linkedCases: ["TC-255"],
    coverage: "Partial",
    latestRun: "Draft coverage only",
  },
];

export const DEFECTS = [
  {
    id: "BUG-342",
    title: "Reviewer list not loading in staging",
    severity: "High",
    priority: "High",
    status: "Open",
    linkedRun: "TR-79",
    linkedCase: "TC-241",
    project: "Confidential Workspace",
    task: "Review confidential access requests",
    sprint: "Sprint 24",
    owner: "Backend Team",
  },
  {
    id: "AUTH-91",
    title: "Expired reset link still accepted",
    severity: "Critical",
    priority: "Critical",
    status: "In Progress",
    linkedRun: "TR-84",
    linkedCase: "TC-201",
    project: "Authentication Revamp",
    task: "Harden password reset flow",
    sprint: "Sprint 24",
    owner: "Platform Team",
  },
  {
    id: "BUG-356",
    title: "Calendar event count mismatches list view",
    severity: "Medium",
    priority: "Medium",
    status: "Review",
    linkedRun: "TR-71",
    linkedCase: "TC-255",
    project: "Planning Experience",
    task: "Verify calendar event grouping",
    sprint: "Sprint 23",
    owner: "Frontend Team",
  },
];

export const DEFECT_PROJECTS = [
  "All Projects",
  "Authentication Revamp",
  "Confidential Workspace",
  "Planning Experience",
  "Task Automation",
];

export const DEFECT_SPRINTS = [
  "All Sprints",
  "Sprint 24",
  "Sprint 23",
  "Release Hardening",
];

export const DEFECT_TASKS = [
  "Harden password reset flow",
  "Review confidential access requests",
  "Verify calendar event grouping",
  "Improve AI task creation",
];

export const DEFECT_RAISE_CONTEXT = {
  selectedRun: "TR-84",
  selectedCase: "TC-201",
  project: "Authentication Revamp",
  task: "Harden password reset flow",
  sprint: "Sprint 24",
  release: "Web App 2.4",
  environment: "Staging",
  assigneeOptions: ["Platform Team", "Backend Team", "Frontend Team", "QA Team"],
  severityOptions: ["Critical", "High", "Medium", "Low"],
  priorityOptions: ["Critical", "High", "Medium", "Low"],
  reproductionSteps: [
    "Request a password reset for a valid user.",
    "Wait until the token expires.",
    "Open the expired reset link and submit a new password.",
  ],
};

export const TEST_CASE_CREATE_CONTEXT = {
  projectOptions: [
    "Authentication Revamp",
    "Confidential Workspace",
    "Planning Experience",
    "Task Automation",
  ],
  sprintOptions: ["Sprint 24", "Sprint 23", "Release Hardening"],
  suiteOptions: [
    "Authentication",
    "Task Management",
    "Projects",
    "Planning",
  ],
  moduleOptions: [
    "Login",
    "Password Reset",
    "Task Creation",
    "Confidential Access",
    "Calendar",
  ],
  priorityOptions: ["Critical", "High", "Medium", "Low"],
  automationOptions: ["Manual", "Automated", "Candidate"],
  linkedTask: "Harden password reset flow",
  linkedStory: "AUTH-72",
  sampleSteps: [
    {
      action: "Open the target page with a valid user session.",
      expected: "The screen loads with the expected module content.",
    },
    {
      action: "Perform the key workflow under test.",
      expected: "The system accepts the action and stores the expected result.",
    },
    {
      action: "Validate the final output in UI and API response.",
      expected: "The result matches business rules and linked requirement.",
    },
  ],
};

export const SPRINT_QA_BOARD = {
  sprint: "Sprint 24",
  release: "Web App 2.4",
  project: "Authentication Revamp",
  window: "Mar 25 - Apr 5",
  summary: [
    {
      label: "Development done",
      value: "8/11",
      detail: "Stories completed and ready for QA handoff",
      icon: "code_blocks",
    },
    {
      label: "QA executed",
      value: "47/62",
      detail: "Cases already run in current sprint",
      icon: "fact_check",
    },
    {
      label: "Open defects",
      value: "9",
      detail: "Across failed and blocked validations",
      icon: "bug_report",
    },
    {
      label: "Release readiness",
      value: "68%",
      detail: "Combined development and QA confidence",
      icon: "track_changes",
    },
  ],
  developmentLanes: [
    {
      title: "In Development",
      items: [
        {
          id: "AUTH-96",
          title: "Lock expired password reset token on submit",
          owner: "Rahul",
          project: "Authentication Revamp",
          qaStatus: "Waiting for handoff",
        },
        {
          id: "AUTH-98",
          title: "Add audit event for reset link rejection",
          owner: "Keerthi",
          project: "Authentication Revamp",
          qaStatus: "No test coverage yet",
        },
      ],
    },
    {
      title: "Ready for QA",
      items: [
        {
          id: "AUTH-72",
          title: "Email login for workspace members",
          owner: "Arjun",
          project: "Authentication Revamp",
          qaStatus: "Mapped to TC-184",
        },
        {
          id: "TASK-188",
          title: "Rich task creation experience",
          owner: "Priya",
          project: "Task Automation",
          qaStatus: "Mapped to TC-223",
        },
      ],
    },
    {
      title: "Blocked by Defects",
      items: [
        {
          id: "PROJ-104",
          title: "Confidential project workflow",
          owner: "Naveen",
          project: "Confidential Workspace",
          qaStatus: "Blocked by BUG-342",
        },
      ],
    },
  ],
  qaLanes: [
    {
      title: "Ready to Test",
      items: [
        {
          id: "TC-184",
          title: "Valid login flow",
          linkedTask: "AUTH-72",
          tester: "Harini",
          result: "Queued",
        },
        {
          id: "TC-223",
          title: "Task creation with AI description",
          linkedTask: "TASK-188",
          tester: "Kavin",
          result: "Queued",
        },
      ],
    },
    {
      title: "In Testing",
      items: [
        {
          id: "TC-201",
          title: "Password reset token expiry",
          linkedTask: "AUTH-96",
          tester: "Neha",
          result: "Running on staging",
        },
      ],
    },
    {
      title: "Failed / Defects Raised",
      items: [
        {
          id: "TC-241",
          title: "Confidential access approval flow",
          linkedTask: "PROJ-104",
          tester: "Maya",
          result: "BUG-342 raised",
        },
      ],
    },
    {
      title: "Passed",
      items: [
        {
          id: "TC-184",
          title: "Valid login flow",
          linkedTask: "AUTH-72",
          tester: "Harini",
          result: "Passed in TR-84",
        },
      ],
    },
  ],
};

export const SPRINT_DEV_BOARD = {
  sprint: "Sprint 24",
  release: "Web App 2.4",
  goal: "Stabilize authentication and finish sprint-ready handoff for QA",
  summary: [
    {
      label: "Planned stories",
      value: "11",
      detail: "Stories committed for current sprint scope",
      icon: "article",
    },
    {
      label: "In progress",
      value: "3",
      detail: "Developer-owned work currently active",
      icon: "developer_mode",
    },
    {
      label: "Ready for QA",
      value: "4",
      detail: "Completed work waiting for test validation",
      icon: "assignment_turned_in",
    },
    {
      label: "Blocked items",
      value: "2",
      detail: "Stories affected by dependency or defect risk",
      icon: "block",
    },
  ],
  lanes: [
    {
      title: "Backlog",
      items: [
        {
          id: "AUTH-102",
          title: "Add reset token audit analytics",
          owner: "Keerthi",
          estimate: "3 pts",
          qa: "Coverage pending",
        },
      ],
    },
    {
      title: "In Progress",
      items: [
        {
          id: "AUTH-96",
          title: "Lock expired password reset token on submit",
          owner: "Rahul",
          estimate: "5 pts",
          qa: "TC-201 linked",
        },
        {
          id: "AUTH-98",
          title: "Add audit event for reset link rejection",
          owner: "Keerthi",
          estimate: "2 pts",
          qa: "Test case draft",
        },
      ],
    },
    {
      title: "Code Review",
      items: [
        {
          id: "TASK-188",
          title: "Rich task creation experience",
          owner: "Priya",
          estimate: "8 pts",
          qa: "TC-223 ready",
        },
      ],
    },
    {
      title: "Ready for QA",
      items: [
        {
          id: "AUTH-72",
          title: "Email login for workspace members",
          owner: "Arjun",
          estimate: "5 pts",
          qa: "TC-184 ready",
        },
        {
          id: "PROJ-104",
          title: "Confidential project workflow",
          owner: "Naveen",
          estimate: "8 pts",
          qa: "Blocked by BUG-342",
        },
      ],
    },
  ],
};

export const SPRINT_WORKSPACE_OVERVIEW = [
  {
    label: "Active sprint",
    value: "Sprint 24",
    detail: "Authentication release hardening window",
    icon: "rocket_launch",
  },
  {
    label: "Team capacity",
    value: "46 pts",
    detail: "Across product, engineering, and QA",
    icon: "groups",
  },
  {
    label: "Planned scope",
    value: "11 items",
    detail: "Stories, bugs, and handoff tasks",
    icon: "assignment",
  },
  {
    label: "Readiness",
    value: "68%",
    detail: "Blend of delivery progress and QA confidence",
    icon: "monitoring",
  },
];

export const SPRINT_PLANNING_BOARD = {
  focusAreas: [
    {
      title: "Release goal",
      detail: "Stabilize authentication and complete end-to-end QA handoff for Web App 2.4.",
      icon: "flag",
    },
    {
      title: "Primary risk",
      detail: "Password-reset hardening and reviewer-list regression can delay release confidence.",
      icon: "warning",
    },
    {
      title: "Sprint cadence",
      detail: "Development lock on Apr 2, QA sweep on Apr 4, release review on Apr 5.",
      icon: "event_upcoming",
    },
  ],
  swimlanes: [
    {
      title: "Committed Scope",
      tone: "bg-blue-50 text-blue-700 border-blue-200",
      items: [
        {
          id: "AUTH-72",
          title: "Email login for workspace members",
          owner: "Arjun",
          points: "5 pts",
          target: "Ready for QA",
        },
        {
          id: "AUTH-96",
          title: "Lock expired password reset token on submit",
          owner: "Rahul",
          points: "5 pts",
          target: "In progress",
        },
        {
          id: "TASK-188",
          title: "Rich task creation experience",
          owner: "Priya",
          points: "8 pts",
          target: "Code review",
        },
      ],
    },
    {
      title: "Stretch Scope",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      items: [
        {
          id: "AUTH-102",
          title: "Add reset token audit analytics",
          owner: "Keerthi",
          points: "3 pts",
          target: "Backlog",
        },
        {
          id: "CAL-31",
          title: "Polish calendar due-date grouping",
          owner: "Riya",
          points: "3 pts",
          target: "Design QA",
        },
      ],
    },
    {
      title: "Dependencies",
      tone: "bg-rose-50 text-rose-700 border-rose-200",
      items: [
        {
          id: "BUG-342",
          title: "Reviewer list not loading in staging",
          owner: "Backend Team",
          points: "Blocker",
          target: "Needs fix before retest",
        },
        {
          id: "ENV-18",
          title: "Mail sandbox stability for reset-link checks",
          owner: "Platform Ops",
          points: "Support",
          target: "Needed for security sweep",
        },
      ],
    },
  ],
  ceremonies: [
    {
      name: "Sprint Planning",
      when: "Mar 30 • 10:00 AM",
      owner: "Product + Engineering",
      agenda: "Lock scope, confirm owners, and assign QA mapping for committed stories.",
    },
    {
      name: "Backlog Refinement",
      when: "Apr 1 • 3:00 PM",
      owner: "Product",
      agenda: "Review stretch items and adjust if blockers spill into committed work.",
    },
    {
      name: "Release Readiness",
      when: "Apr 5 • 11:30 AM",
      owner: "QA + Engineering",
      agenda: "Walk pass/fail trends, open defects, and deployment recommendation.",
    },
  ],
};

export const SPRINT_MONITORING_BOARD = {
  stats: [
    {
      label: "Velocity",
      value: "29 / 46 pts",
      detail: "Completed and accepted so far this sprint",
      icon: "speed",
    },
    {
      label: "Burndown trend",
      value: "On track",
      detail: "2 points ahead of projected line",
      icon: "trending_down",
    },
    {
      label: "Blocked items",
      value: "2",
      detail: "Need dependency or defect resolution",
      icon: "block",
    },
    {
      label: "QA confidence",
      value: "7 / 10",
      detail: "Weighted from pass rate and blocker severity",
      icon: "verified",
    },
  ],
  checkpoints: [
    {
      title: "Scope health",
      status: "Healthy",
      note: "Committed stories are still inside planned capacity with one stretch item paused.",
    },
    {
      title: "Engineering flow",
      status: "Watch",
      note: "Two items are sitting in review longer than 24 hours and may affect QA start time.",
    },
    {
      title: "QA execution",
      status: "At risk",
      note: "Security sweep depends on staging mail sandbox reliability and BUG-342 resolution.",
    },
  ],
  incidents: [
    {
      id: "INC-18",
      title: "Reviewer endpoint returning 500 in staging",
      severity: "High",
      owner: "Backend Team",
      eta: "Today • 5:00 PM",
    },
    {
      id: "INC-21",
      title: "Reset-link email delayed in sandbox environment",
      severity: "Medium",
      owner: "Platform Ops",
      eta: "Tomorrow • 11:00 AM",
    },
  ],
  teamPulse: [
    {
      name: "Frontend",
      summary: "1 item in review, 1 ready for QA",
      tone: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      name: "Backend",
      summary: "1 blocker fix in progress, audit analytics queued",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      name: "QA",
      summary: "47 of 62 cases executed, defect retests pending",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ],
};

export const SPRINT_CREATE_CONTEXT = {
  templates: [
    {
      name: "Release Hardening Sprint",
      focus: "Bug fixes, regression, stabilization",
      capacity: "40-48 pts",
    },
    {
      name: "Feature Delivery Sprint",
      focus: "Story completion with QA handoff",
      capacity: "48-55 pts",
    },
    {
      name: "Design QA Sprint",
      focus: "UX polish, validation, and defect closure",
      capacity: "28-36 pts",
    },
  ],
  owners: ["Harini", "Arjun", "Priya", "Rahul", "Keerthi", "Maya"],
  squadOptions: ["Platform", "Frontend", "Backend", "QA", "Cross-functional"],
  releaseOptions: ["Web App 2.4", "Security Patch", "UX Refresh"],
};

export const statusClasses: Record<TestCaseStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Ready: "bg-blue-100 text-blue-700 border-blue-200",
  Blocked: "bg-amber-100 text-amber-700 border-amber-200",
  Passed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Failed: "bg-rose-100 text-rose-700 border-rose-200",
};

export const priorityClasses: Record<TestCasePriority, string> = {
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-blue-50 text-blue-700 border-blue-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

export const automationClasses: Record<TestAutomation, string> = {
  Manual: "bg-slate-100 text-slate-700 border-slate-200",
  Automated: "bg-blue-50 text-blue-700 border-blue-200",
  Candidate: "bg-amber-50 text-amber-700 border-amber-200",
};

export const qaSectionLinks = [
  { to: "/test-cases", label: "Test Cases", icon: "fact_check" },
  { to: "/test-cases/create", label: "Create Test Case", icon: "add_task" },
  { to: "/test-plans", label: "Test Plans", icon: "assignment" },
  { to: "/test-runs", label: "Test Runs", icon: "playlist_play" },
  { to: "/test-traceability", label: "Traceability", icon: "account_tree" },
  { to: "/test-defects", label: "Defects", icon: "bug_report" },
  { to: "/test-defects/raise", label: "Raise Defect", icon: "add_circle" },
  { to: "/test-reports", label: "Reports", icon: "analytics" },
];

export const testCaseSectionLinks = [
  { to: "/test-cases", label: "Test Cases", icon: "fact_check" },
  { to: "/test-cases/create", label: "Create Test Case", icon: "add_task" },
  { to: "/test-plans", label: "Test Plans", icon: "assignment" },
  { to: "/test-runs", label: "Test Runs", icon: "playlist_play" },
  { to: "/test-traceability", label: "Traceability", icon: "account_tree" },
  { to: "/test-reports", label: "Reports", icon: "analytics" },
];

export const defectSectionLinks = [
  { to: "/test-defects", label: "Defects", icon: "bug_report" },
  { to: "/test-defects/raise", label: "Raise Defect", icon: "add_circle" },
  { to: "/test-defects/reports", label: "Reports", icon: "analytics" },
];
