import { NotEmpty } from "sequelize-typescript";
import { TaskPriority } from "../enums";

export const createTaskSchema = {
  title: {
    notEmpty: {
      errorMessage: "Task title is required",
    },
    isLength: {
      options: { min: 2, max: 200 },
      errorMessage: "Task title must be between 2 and 200 characters",
    },
  },
  description: {
    notEmpty: {
      errorMessage: "Description is required",
    },
    trim: true,
    isLength: {
      options: { min: 10, max: 1000 },
      errorMessage: "Description must be between 10 and 1000 characters",
    },
  },
  status: {
    optional: true,
    isIn: {
      options: [["To Do", "In Progress", "Done"]],
      errorMessage: "Status must be one of: To Do, In Progress, Done",
    },
  },
  priority:{
    notEmpty: {
      errorMessage: "priority required",
    },
    isIn:{
      options:[[TaskPriority.HIGH,TaskPriority.LOW,TaskPriority.MEDIUM]],
      errorMessage: `priority must be one of:${TaskPriority.HIGH,TaskPriority.LOW,TaskPriority.MEDIUM}`,
    }
  },
  // priority: {
  //   optional: true,
  //   custom: {
  //     options: (value: unknown) => {
  //       if (value == null) return true;
  //       const normalized = String(value).trim().toLowerCase();
  //       return ["low", "medium", "high"].includes(normalized);
  //     },
  //     errorMessage: "Priority must be one of: Low, Medium, High Giri",
  //   },
  //   customSanitizer: {
  //     options: (value: unknown) => {
  //       if (value == null) return value;

  //       const normalized = String(value).trim().toLowerCase();

  //       const map: Record<string, string> = {
  //         low: "Low",
  //         medium: "Medium",
  //         high: "High",
  //       };

  //       return map[normalized] ?? value;
  //     },
  //   },
  // },
  project_id: {
    notEmpty: {
      errorMessage: "Project ID is required",
    },
    isUUID: {
      errorMessage: "Project ID must be a valid UUID",
    },
  },
  assignee_id: {
    optional: true,
    isUUID: {
      errorMessage: "Assignee ID must be a valid UUID",
    },
  },
  due_date: {
    optional: true,
    isISO8601: {
      errorMessage: "Due date must be a valid ISO 8601 date",
    },
  },
  invitees: {
    optional: true,
    isArray: {
      errorMessage: "Invitees must be an array",
    },
  },
  "invitees.*.full_name": {
    optional: true,
    isLength: {
      options: { min: 1, max: 255 },
      errorMessage: "Invitee full name must be 1 to 255 characters",
    },
  },
  "invitees.*.email": {
    optional: true,
    isEmail: {
      errorMessage: "Invitee email must be valid",
    },
  },
};

export const updateTaskSchema = {
  title: {
    optional: { options: { nullable: true } },
    trim: true,
    notEmpty: {
      errorMessage: "Task title cannot be empty",
    },
    isLength: {
      options: { min: 2, max: 200 },
      errorMessage: "Task title must be between 2 and 200 characters",
    },
  },
  description: {
    optional: { options: { nullable: true } },
    trim: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: "Description must not exceed 1000 characters",
    },
  },
  status: {
    optional: true,
    isIn: {
      options: [["To Do", "In Progress", "Done"]],
      errorMessage: "Status must be one of: To Do, In Progress, Done",
    },
  },
  priority: {
    optional: true,
    custom: {
      options: (value: unknown) => {
        if (value == null) return true;
        const normalized = String(value).trim().toLowerCase();
        return ["low", "medium", "high"].includes(normalized);
      },
      errorMessage: "Priority must be one of: Low, Medium, High Giri",
    },
    customSanitizer: {
      options: (value: unknown) => {
        if (value == null) return value;

        const normalized = String(value).trim().toLowerCase();

        const map: Record<string, string> = {
          low: "Low",
          medium: "Medium",
          high: "High",
        };

        return map[normalized] ?? value;
      },
    },
  },
  assignee_id: {
    optional: true,
    isUUID: {
      errorMessage: "Assignee ID must be a valid UUID",
    },
  },
  due_date: {
    optional: { options: { nullable: true } },
    custom: {
      options: (value: unknown) => {
        if (value === null || value === undefined || value === "") return true;
        if (typeof value !== "string") return false;
        const time = Date.parse(value);
        return Number.isFinite(time);
      },
      errorMessage: "Due date must be a valid ISO 8601 date",
    },
  },
};
