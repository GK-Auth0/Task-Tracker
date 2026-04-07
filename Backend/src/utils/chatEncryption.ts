import crypto from "crypto";
import { appConfig } from "../config";

const ENCRYPTION_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const normalizeConfiguredKey = (value?: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized;
};

const resolveEncryptionKey = () => {
  const configuredKey = normalizeConfiguredKey(process.env.CHAT_MESSAGE_ENCRYPTION_KEY);
  const source = configuredKey || appConfig.jwt.accessSecret || appConfig.jwt.secret;

  if (!source) {
    throw new Error("Chat encryption key is not configured");
  }

  try {
    const asBase64 = Buffer.from(source, "base64");
    if (asBase64.length === 32 && asBase64.toString("base64") === source) {
      return asBase64;
    }
  } catch (error) {
    // Fall through and derive from the raw string value below.
  }

  return crypto.createHash("sha256").update(source, "utf8").digest();
};

const getEncryptionKey = () => resolveEncryptionKey();

export const isEncryptedChatContent = (value: string) =>
  String(value || "").startsWith(ENCRYPTION_PREFIX);

export const encryptChatContent = (value: string) => {
  const plainText = String(value ?? "");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString("base64")}`;
};

export const decryptChatContent = (value: string) => {
  const serialized = String(value ?? "");
  if (!isEncryptedChatContent(serialized)) {
    return serialized;
  }

  const payload = serialized.slice(ENCRYPTION_PREFIX.length);
  const raw = Buffer.from(payload, "base64");

  if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted chat payload is malformed");
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};
