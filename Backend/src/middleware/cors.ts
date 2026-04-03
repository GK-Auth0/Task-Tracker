import cors, { CorsOptionsDelegate } from "cors";


const parseList = (value?: string): string[] => {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
};

const allowedOrigins = parseList(process.env.CORS_ALLOWED_ORIGINS);
const allowedPatterns = parseList(process.env.CORS_ALLOWED_ORIGIN_PATTERNS);

/**
 * Check wildcard patterns like:
 */
const matchesPattern = (origin: string) => {
  try {
    const hostname = new URL(origin).hostname;

    return allowedPatterns.some((pattern) => {
      if (!pattern.startsWith("*.")) return false;

      const domain = pattern.replace("*.", "");
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
};

const isOriginAllowed = (origin: string) => {
  if (allowedOrigins.includes(origin)) return true;
  if (matchesPattern(origin)) return true;
  return false;
};

/**
 * CORS Delegate
 */
export const corsOptionsDelegate: CorsOptionsDelegate = (req, callback) => {
  const origin = req.headers.origin;

  // Allow server-to-server / Postman / curl
  if (!origin) {
    return callback(null, {
      origin: true,
      credentials: true,
    });
  }

  if (isOriginAllowed(origin)) {
    return callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key",
      ],
    });
  }

  console.warn("CORS BLOCKED:", origin);

  // IMPORTANT: Do NOT throw error (breaks preflight)
  return callback(null, {
    origin: false,
  });
};

/**
 * Middleware setup
 */
export const setupCors = (app: any) => {
  // Main CORS
  app.use(cors(corsOptionsDelegate));

  // 🔥 Handle preflight explicitly
  app.options("*", cors(corsOptionsDelegate));
};
