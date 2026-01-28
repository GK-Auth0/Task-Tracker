import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Tracker API",
      version: "1.0.0",
      description: "A comprehensive task management API",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            full_name: { type: "string" },
            role: { type: "string", enum: ["Admin", "Member", "Viewer"] },
            avatar_url: { type: "string", format: "uri" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["Active", "Completed", "On Hold"],
            },
            owner_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ProjectWithStats: {
          allOf: [
            { $ref: "#/components/schemas/Project" },
            {
              type: "object",
              properties: {
                statistics: {
                  type: "object",
                  properties: {
                    total_tasks: { type: "integer" },
                    completed_tasks: { type: "integer" },
                    in_progress_tasks: { type: "integer" },
                    todo_tasks: { type: "integer" },
                  },
                },
              },
            },
          ],
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["To Do", "In Progress", "Completed"],
            },
            priority: { type: "string", enum: ["Low", "Medium", "High"] },
            project_id: { type: "string", format: "uuid" },
            creator_id: { type: "string", format: "uuid" },
            assignee_id: { type: "string", format: "uuid" },
            due_date: { type: "string", format: "date-time" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        TaskWithRelations: {
          allOf: [
            { $ref: "#/components/schemas/Task" },
            {
              type: "object",
              properties: {
                project: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                  },
                },
                creator: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    full_name: { type: "string" },
                    email: { type: "string", format: "email" },
                  },
                },
                assignee: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    full_name: { type: "string" },
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          ],
        },
        TaskWithDetails: {
          allOf: [
            { $ref: "#/components/schemas/TaskWithRelations" },
            {
              type: "object",
              properties: {
                subtasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      title: { type: "string" },
                      is_completed: { type: "boolean" },
                    },
                  },
                },
                comments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      content: { type: "string" },
                      user: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          full_name: { type: "string" },
                        },
                      },
                      created_at: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          ],
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            full_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["Admin", "Member", "Viewer"] },
            avatar_url: { type: "string", format: "uri" },
          },
        },
        UserWithTasks: {
          allOf: [
            { $ref: "#/components/schemas/UserProfile" },
            {
              type: "object",
              properties: {
                created_at: { type: "string", format: "date-time" },
                assigned_tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      title: { type: "string" },
                      status: {
                        type: "string",
                        enum: ["To Do", "In Progress", "Completed"],
                      },
                      priority: {
                        type: "string",
                        enum: ["Low", "Medium", "High"],
                      },
                      due_date: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          ],
        },
        DashboardSummary: {
          type: "object",
          properties: {
            total_tasks: { type: "integer", example: 25 },
            completed_tasks: { type: "integer", example: 15 },
            in_progress_tasks: { type: "integer", example: 7 },
            todo_tasks: { type: "integer", example: 3 },
            overdue_tasks: { type: "integer", example: 2 },
            completion_rate: { type: "integer", example: 60 },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: [
    "./src/docs/swagger/auth.swagger.yaml",
    "./src/docs/swagger/project.swagger.yaml",
    "./src/docs/swagger/task.swagger.yaml",
    "./src/docs/swagger/user.swagger.yaml",
    "./src/docs/swagger/dashboard.swagger.yaml",
    "./src/app.ts",
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
    }),
  );
};
