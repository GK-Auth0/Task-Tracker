import swaggerUi from "swagger-ui-express";
import express, { Express } from "express";
import fs from "fs";
import path from "path";
import YAML from "yaml";

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
  const primaryDir = path.join(__dirname, "../docs/openapi");
  const specsDirs = [
    primaryDir,
    path.join(process.cwd(), "src/docs/openapi"),
    path.join(process.cwd(), "dist/docs/openapi"),
    path.join(process.cwd(), "Backend/src/docs/openapi"),
    path.join(process.cwd(), "Backend/dist/docs/openapi"),
    path.join(__dirname, "docs/openapi"),
  ];

  const findSpecsDir = () => {
    let best: { dir: string; count: number } | null = null;
    for (const dir of specsDirs) {
      try {
        const entries = fs.readdirSync(dir);
        const count = entries.filter((file) => file.endsWith(".yaml")).length;
        if (count > 0) {
          if (!best || count > best.count) {
            best = { dir, count };
          }
        }
      } catch {
        // try next
      }
    }
    return best?.dir || null;
  };

  const activeSpecsDir = findSpecsDir();

  const resolveSpecPath = (fileName: string) => {
    for (const dir of specsDirs) {
      const fullPath = path.join(dir, fileName);
      try {
        fs.accessSync(fullPath);
        return fullPath;
      } catch {
        // try next
      }
    }
    return null;
  };

  const loadSpec = (fileName: string) => {
    const filePath =
      (activeSpecsDir && path.join(activeSpecsDir, fileName)) ||
      resolveSpecPath(fileName);
    if (!filePath) return null;
    const content = fs.readFileSync(filePath, "utf8");
    try {
      return YAML.parse(content);
    } catch (error) {
      console.error(`[swagger] Failed to parse ${filePath}:`, error);
      return null;
    }
  };

  app.get("/api-docs/specs/:spec", (req, res) => {
    const fileName = req.params.spec;
    if (!fileName || !fileName.endsWith(".yaml")) {
      return res.status(400).send("Invalid spec name");
    }
    const filePath = resolveSpecPath(fileName);
    if (!filePath) {
      return res.status(404).send("Spec not found");
    }
    const content = fs.readFileSync(filePath, "utf8");
    res.type("text/yaml").send(content);
  });

  // Index page with links to each module doc
  app.get("/api-docs/index", (_req, res) => {
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
          <ul><li><a href="/api-docs">All Modules</a></li></ul>
          <ul>${links}</ul>
        </body>
      </html>
    `);
  });

  const mergedSpec = (() => {
    const base = {
      openapi: "3.0.3",
      info: { title: "Task Tracker API", version: "1.0.0" },
      servers: [
        { url: "http://localhost:3000", description: "Local" },
      ],
      paths: {},
      components: {},
      tags: [],
    } as any;

    const specsToMerge =
      activeSpecsDir && fs.existsSync(activeSpecsDir)
        ? fs
            .readdirSync(activeSpecsDir)
            .filter((file) => file.endsWith(".yaml"))
        : specMap.map((spec) => `${spec.slug}.yaml`);

    specsToMerge.forEach((file) => {
      const parsed = loadSpec(file);
      if (!parsed) return;
      base.paths = { ...base.paths, ...(parsed.paths || {}) };
      base.components = {
        ...base.components,
        ...(parsed.components || {}),
        schemas: {
          ...(base.components?.schemas || {}),
          ...(parsed.components?.schemas || {}),
        },
        securitySchemes: {
          ...(base.components?.securitySchemes || {}),
          ...(parsed.components?.securitySchemes || {}),
        },
      };
      if (Array.isArray(parsed.tags)) {
        base.tags = [...base.tags, ...parsed.tags];
      }
      if (Array.isArray(parsed.servers)) {
        base.servers = parsed.servers;
      }
    });

    return base;
  })();

  console.log(
    `[swagger] Using specs dir: ${activeSpecsDir || "auto"} | paths: ${
      Object.keys(mergedSpec.paths || {}).length
    }`,
  );

  app.get("/api-docs/all", (_req, res) => {
    res.redirect("/api-docs");
  });

  // Combined UI (single merged spec)
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(mergedSpec, {
      explorer: false,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Task Tracker API - All Modules",
    }),
  );

  // Module-specific Swagger UIs
  specMap.forEach((spec) => {
    const parsed = loadSpec(`${spec.slug}.yaml`);
    if (!parsed) return;
    app.use(
      `/api-docs/${spec.slug}`,
      swaggerUi.serve,
      swaggerUi.setup(parsed, {
        explorer: false,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: `Task Tracker API - ${spec.title}`,
      }),
    );
  });
};
