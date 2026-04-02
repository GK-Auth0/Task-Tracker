import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";

type OpenApiDocument = {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: Array<Record<string, unknown>>;
  tags?: Array<Record<string, unknown>>;
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
};

const docsDirectories = [
  path.join(process.cwd(), "src/api-docs/openapi"),
  path.join(process.cwd(), "Backend/src/api-docs/openapi"),
  path.join(process.cwd(), "dist/api-docs/openapi"),
  path.join(process.cwd(), "Backend/dist/api-docs/openapi"),
  path.join(__dirname, "openapi"),
];

const logoCandidates = [
  path.join(process.cwd(), "UI/public/favicon.png"),
  path.join(process.cwd(), "UI/public/faviconq.png"),
  path.join(process.cwd(), "public/favicon.png"),
];

const findDocsDirectory = () => {
  for (const directory of docsDirectories) {
    try {
      if (fs.statSync(directory).isDirectory()) {
        return directory;
      }
    } catch {
      // try next directory
    }
  }

  return null;
};

const findLogoPath = () => {
  for (const logoPath of logoCandidates) {
    try {
      if (fs.statSync(logoPath).isFile()) {
        return logoPath;
      }
    } catch {
      // try next path
    }
  }

  return null;
};

const loadYamlDocument = (filePath: string): OpenApiDocument | null => {
  try {
    return YAML.parse(fs.readFileSync(filePath, 'utf8')) as OpenApiDocument;
  } catch (error) {
    console.error(`[api-docs] Failed to load ${filePath}:`, error);
    return null;
  }
};

const mergeDocuments = (documents: OpenApiDocument[]) => {
  const merged: OpenApiDocument = {
    openapi: "3.0.3",
    info: {
      title: "Task Tracker API",
      version: "1.0.0",
      description: "API documentation for the Task Tracker backend.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local server" }],
    tags: [],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {},
    },
  };

  for (const document of documents) {
    merged.paths = {
      ...(merged.paths || {}),
      ...(document.paths || {}),
    };

    merged.components = {
      ...(merged.components || {}),
      ...(document.components || {}),
      schemas: {
        ...((merged.components || {}).schemas as Record<string, unknown> | undefined),
        ...((document.components || {}).schemas as Record<string, unknown> | undefined),
      },
      securitySchemes: {
        ...((merged.components || {}).securitySchemes as Record<string, unknown> | undefined),
        ...((document.components || {}).securitySchemes as Record<string, unknown> | undefined),
      },
    };

    if (Array.isArray(document.tags)) {
      merged.tags = [...(merged.tags || []), ...document.tags];
    }
  }

  return merged;
};

export const setupApiDocs = (app: Express) => {
  const docsDirectory = findDocsDirectory();
  const logoPath = findLogoPath();

  if (!docsDirectory) {
    console.warn("[api-docs] No OpenAPI docs directory found. Skipping Swagger UI setup.");
    return;
  }

  const files = fs
    .readdirSync(docsDirectory)
    .filter((file) => file.endsWith(".yaml"))
    .sort();

  const documents = files
    .map((file) => loadYamlDocument(path.join(docsDirectory, file)))
    .filter((document): document is OpenApiDocument => Boolean(document));

  const mergedDocument = mergeDocuments(documents);

  app.get("/api-docs/specs/:fileName", (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(docsDirectory, fileName);

    if (!fileName.endsWith(".yaml") || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Spec file not found",
      });
    }

    return res.type("text/yaml").send(fs.readFileSync(filePath, "utf8"));
  });

  if (logoPath) {
    app.get("/api-docs/assets/logo", (_req, res) => {
      res.sendFile(logoPath);
    });
  }

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(mergedDocument, {
      explorer: true,
      customSiteTitle: "Task Tracker API Docs",
      customfavIcon: logoPath ? "/api-docs/assets/logo" : undefined,
      customCss: `
        .swagger-ui .topbar {
          background: #111827;
          border-bottom: 1px solid #1f2937;
        }
        .swagger-ui .topbar-wrapper img {
          display: none;
        }
        .swagger-ui .topbar-wrapper .link {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
        }
        .swagger-ui .topbar-wrapper .link::before {
          content: "";
          width: 32px;
          height: 32px;
          display: inline-block;
          background-image: url("/api-docs/assets/logo");
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 8px;
        }
      `,
    }),
  );
};
