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
    optional: true,
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
    isIn: {
      options: [["Low", "Medium", "High"]],
      errorMessage: "Priority must be one of: Low, Medium, High",
    },
  },
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
};

export const updateTaskSchema = {
  title: {
    optional: true,
    isLength: {
      options: { min: 2, max: 200 },
      errorMessage: "Task title must be between 2 and 200 characters",
    },
  },
  description: {
    optional: true,
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
    isIn: {
      options: [["Low", "Medium", "High"]],
      errorMessage: "Priority must be one of: Low, Medium, High",
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
};