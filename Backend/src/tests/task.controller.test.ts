import { Request, Response } from "express";
import { createNewTask } from "../controllers/task";
import { createTask } from "../services/task";
import { createAuditLog } from "../services/auditService";
import { processInvites } from "../services/invitation";

jest.mock("../helpers/validation", () => ({
  handleValidationErrors: jest.fn(() => false),
}));

jest.mock("../services/task", () => ({
  createTask: jest.fn(),
  getAllTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTaskPullRequests: jest.fn(),
  getTaskCommits: jest.fn(),
}));

jest.mock("../services/auditService", () => ({
  createAuditLog: jest.fn(),
  getAuditLogs: jest.fn(),
}));

jest.mock("../services/invitation", () => ({
  processInvites: jest.fn(),
}));

const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedCreateAuditLog = createAuditLog as jest.MockedFunction<
  typeof createAuditLog
>;
const mockedProcessInvites = processInvites as jest.MockedFunction<
  typeof processInvites
>;

const createResponseMock = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    status,
    json,
    response: { status, json } as unknown as Response,
  };
};

describe("task controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createNewTask returns 201 with created task data", async () => {
    mockedCreateTask.mockResolvedValue({
      id: "task-123",
      title: "Ship create-task flow",
      description: "Add create-task coverage for the modal and API.",
      status: "To Do",
      priority: "Medium",
      issue_type: "Task",
      project_id: "project-123",
      assignee_id: "user-456",
      creator_id: "user-123",
      due_date: "2026-04-10",
      project: {
        id: "project-123",
        name: "Task Tracker",
      },
    } as any);
    mockedProcessInvites.mockResolvedValue({
      invited: 0,
      skipped: 0,
      failed: 0,
    } as any);
    mockedCreateAuditLog.mockResolvedValue(undefined as any);

    const req = {
      user: { id: "user-123" },
      body: {
        title: "Ship create-task flow",
        description: "  Add create-task coverage for the modal and API.  ",
        priority: "Medium",
        project_id: "project-123",
        assignee_id: "user-456",
        due_date: "2026-04-10",
        invitees: [],
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await createNewTask(req, response);

    expect(mockedCreateTask).toHaveBeenCalledWith({
      title: "Ship create-task flow",
      description: "Add create-task coverage for the modal and API.",
      status: "To Do",
      priority: "Medium",
      issue_type: "Task",
      project_id: "project-123",
      assignee_id: "user-456",
      defect_id: undefined,
      sprint_id: undefined,
      creator_id: "user-123",
      due_date: "2026-04-10",
    });
    expect(mockedProcessInvites).toHaveBeenCalledWith({
      contextType: "task",
      projectId: "project-123",
      taskId: "task-123",
      invitedBy: "user-123",
      invitees: [],
    });
    expect(mockedCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: "task",
        entity_id: "task-123",
        action: "created",
        user_id: "user-123",
        new_values: expect.objectContaining({
          title: "Ship create-task flow",
          description: "Add create-task coverage for the modal and API.",
          issue_type: "Task",
        }),
      }),
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Task created successfully",
      data: {
        id: "task-123",
        title: "Ship create-task flow",
        description: "Add create-task coverage for the modal and API.",
        status: "To Do",
        priority: "Medium",
        issue_type: "Task",
        project_id: "project-123",
        assignee_id: "user-456",
        creator_id: "user-123",
        due_date: "2026-04-10",
        project: {
          id: "project-123",
          name: "Task Tracker",
        },
        invite_summary: {
          invited: 0,
          skipped: 0,
          failed: 0,
        },
      },
    });
  });

  it("createNewTask returns 400 when task creation fails", async () => {
    mockedCreateTask.mockRejectedValue(new Error("Access denied to this project"));

    const req = {
      user: { id: "user-123" },
      body: {
        title: "Blocked task",
        description: "This should surface the backend create-task error.",
        priority: "Medium",
        project_id: "project-123",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await createNewTask(req, response);

    expect(mockedProcessInvites).not.toHaveBeenCalled();
    expect(mockedCreateAuditLog).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to create task",
      error: "Access denied to this project",
    });
  });

  it("createNewTask normalizes lowercase priority before saving", async () => {
    mockedCreateTask.mockResolvedValue({
      id: "task-123",
      title: "Normalized task priority",
      description: "Ensure lowercase task priority is persisted in backend format.",
      status: "To Do",
      priority: "Medium",
      project_id: "project-123",
      creator_id: "user-123",
      project: {
        id: "project-123",
        name: "Task Tracker",
      },
    } as any);
    mockedProcessInvites.mockResolvedValue({
      invited: 0,
      skipped: 0,
      failed: 0,
    } as any);
    mockedCreateAuditLog.mockResolvedValue(undefined as any);

    const req = {
      user: { id: "user-123" },
      body: {
        title: "Normalized task priority",
        description: "  Ensure lowercase task priority is persisted in backend format.  ",
        priority: "medium",
        project_id: "project-123",
        invitees: [],
      },
    } as unknown as Request;
    const { response } = createResponseMock();

    await createNewTask(req, response);

    expect(mockedCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "Medium",
      }),
    );
  });
});
