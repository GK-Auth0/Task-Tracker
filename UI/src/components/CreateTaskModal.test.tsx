import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateTaskModal from "./CreateTaskModal";
import { aiAssistantAPI } from "../services/aiAssistant";
import { projectsAPI, tasksAPI, usersAPI } from "../services/dashboard";

vi.mock("../services/dashboard", () => ({
  tasksAPI: {
    createTask: vi.fn(),
  },
  usersAPI: {
    getUsers: vi.fn(),
  },
  projectsAPI: {
    getProjects: vi.fn(),
  },
}));

vi.mock("../services/aiAssistant", () => ({
  aiAssistantAPI: {
    suggestTask: vi.fn(),
  },
}));

vi.mock("../utils/taskAiAssistant", () => ({
  getTaskAiSuggestion: vi.fn(() => ({
    priority: "Medium",
    dueDate: "2026-04-08",
    checklist: ["Clarify acceptance criteria"],
    reason: "Local fallback suggestion.",
  })),
}));

vi.mock("./InviteCollaboratorDialog", () => ({
  default: () => null,
}));

describe("CreateTaskModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    vi.mocked(usersAPI.getUsers).mockResolvedValue({
      success: true,
      data: [
        {
          id: "user-1",
          full_name: "Alex Doe",
          email: "alex@example.com",
          role: "Member",
        },
      ],
    });
    vi.mocked(projectsAPI.getProjects).mockResolvedValue({
      success: true,
      data: [{ id: "project-1", name: "Task Tracker" }],
    } as any);
    vi.mocked(aiAssistantAPI.suggestTask).mockResolvedValue({
      priority: "Medium",
      due_date: "2026-04-08",
      estimated_hours: 2,
      checklist: ["Clarify acceptance criteria"],
      reason: "Remote suggestion.",
    });
  });

  it("submits a task with trimmed values and notifies callers", async () => {
    vi.mocked(tasksAPI.createTask).mockResolvedValue({
      success: true,
      data: {} as any,
    });
    const onClose = vi.fn();
    const onTaskCreated = vi.fn();

    render(
      <CreateTaskModal
        isOpen={true}
        onClose={onClose}
        onTaskCreated={onTaskCreated}
      />,
    );

    await waitFor(() => {
      expect(projectsAPI.getProjects).toHaveBeenCalled();
      expect(usersAPI.getUsers).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText("e.g. Design system update"), {
      target: { value: "  Ship create task tests  " },
    });
    fireEvent.change(screen.getByLabelText("Project selection"), {
      target: { value: "project-1" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the work to be done, outcome, and acceptance criteria...",
      ),
      {
        target: { value: "  Add coverage for the create-task flow in UI and API.  " },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    await waitFor(() => {
      expect(tasksAPI.createTask).toHaveBeenCalledWith({
        title: "Ship create task tests",
        description: "Add coverage for the create-task flow in UI and API.",
        project_id: "project-1",
        assignee_id: undefined,
        due_date: undefined,
        priority: "Medium",
        invitees: [],
      });
    });
    expect(onTaskCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits the selected priority value unchanged", async () => {
    vi.mocked(tasksAPI.createTask).mockResolvedValue({
      success: true,
      data: {} as any,
    });

    render(
      <CreateTaskModal
        isOpen={true}
        onClose={vi.fn()}
        onTaskCreated={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(projectsAPI.getProjects).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText("e.g. Design system update"), {
      target: { value: "Priority propagation" },
    });
    fireEvent.change(screen.getByLabelText("Project selection"), {
      target: { value: "project-1" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the work to be done, outcome, and acceptance criteria...",
      ),
      {
        target: { value: "Make sure the selected priority reaches the backend unchanged." },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "High" }));
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    await waitFor(() => {
      expect(tasksAPI.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "High",
        }),
      );
    });
  });

  it("shows backend validation details when create task fails", async () => {
    vi.mocked(tasksAPI.createTask).mockRejectedValue({
      response: {
        data: {
          errors: [
            {
              field: "project_id",
              message: "Project ID is required",
            },
          ],
        },
      },
    });

    render(
      <CreateTaskModal
        isOpen={true}
        onClose={vi.fn()}
        onTaskCreated={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(projectsAPI.getProjects).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText("e.g. Design system update"), {
      target: { value: "Create task validation" },
    });
    fireEvent.change(screen.getByLabelText("Project selection"), {
      target: { value: "project-1" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the work to be done, outcome, and acceptance criteria...",
      ),
      {
        target: { value: "Surface the backend validation details in the modal." },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    expect(
      await screen.findByText("project_id: Project ID is required"),
    ).toBeInTheDocument();
  });
});
