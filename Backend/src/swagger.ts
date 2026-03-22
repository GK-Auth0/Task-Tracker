import swaggerUi from "swagger-ui-express";
import express, { Express } from "express";
import { promises as fs } from "fs";
import path from "path";

const specMap = [
  { slug: "auth", title: "Auth", file: "./src/docs/openapi/auth.yaml" },
  { slug: "projects", title: "Projects", file: "./src/docs/openapi/projects.yaml" },
  { slug: "tasks", title: "Tasks", file: "./src/docs/openapi/tasks.yaml" },
  { slug: "users", title: "Users", file: "./src/docs/openapi/users.yaml" },
  { slug: "dashboard", title: "Dashboard", file: "./src/docs/openapi/dashboard.yaml" },
  { slug: "preferences", title: "Preferences", file: "./src/docs/openapi/preferences.yaml" },
  { slug: "chat", title: "Chat", file: "./src/docs/openapi/chat.yaml" },
  { slug: "ai", title: "AI", file: "./src/docs/openapi/ai.yaml" },
  { slug: "audit-logs", title: "Audit Logs", file: "./src/docs/openapi/audit-logs.yaml" },
  { slug: "invites", title: "Invites", file: "./src/docs/openapi/invites.yaml" },
  { slug: "webhook", title: "Webhook", file: "./src/docs/openapi/webhook.yaml" },
  { slug: "system", title: "System", file: "./src/docs/openapi/system.yaml" },
];

export const setupSwagger = (app: Express) => {
  const specsDirs = [
    path.join(process.cwd(), "src/docs/openapi"),
    path.join(process.cwd(), "dist/docs/openapi"),
  ];

  const resolveSpecPath = async (fileName: string) => {
    for (const dir of specsDirs) {
      const fullPath = path.join(dir, fileName);
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        // try next
      }
    }
    return null;
  };

  app.get("/api-docs/specs/:spec", async (req, res) => {
    const fileName = req.params.spec;
    if (!fileName || !fileName.endsWith(".yaml")) {
      return res.status(400).send("Invalid spec name");
    }
    const filePath = await resolveSpecPath(fileName);
    if (!filePath) {
      return res.status(404).send("Spec not found");
    }
    const content = await fs.readFile(filePath, "utf8");
    res.type("text/yaml").send(content);
  });

  // Index page with links to each module doc
  app.get("/api-docs", (_req, res) => {
    const links = specMap
      .map(
        (spec) =>
          `<li><a href="/api-docs/${spec.slug}">${spec.title}</a></li>`,
      )
      .join("");
    res.send(`
      <html>
        <head>
          <title>Task Tracker API Docs</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            ul { padding-left: 18px; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Task Tracker API Docs</h1>
          <p>Select a module:</p>
          <ul><li><a href="/api-docs/all">All Modules</a></li></ul>
          <ul>${links}</ul>
        </body>
      </html>
    `);
  });

  // Combined UI (multi-spec selector)
  app.use(
    "/api-docs/all",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: false,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Task Tracker API - All Modules",
      swaggerOptions: {
        urls: specMap.map((spec) => ({
          name: spec.title,
          url: `/api-docs/specs/${spec.slug}.yaml`,
        })),
      },
    }),
  );

  // Module-specific Swagger UIs
  specMap.forEach((spec) => {
    app.use(
      `/api-docs/${spec.slug}`,
      swaggerUi.serve,
      swaggerUi.setup(null, {
        explorer: false,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: `Task Tracker API - ${spec.title}`,
        swaggerOptions: {
          url: `/api-docs/specs/${spec.slug}.yaml`,
        },
      }),
    );
  });
};
