import axios from "axios";
import nodemailer from "nodemailer";
import { appConfig } from "../config/app";
import {
  buildInviteHtml,
  buildOtpHtml,
  buildResetPasswordHtml,
  buildSignupWelcomeHtml,
  buildWelcomeHtml,
} from "../email/templates";

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || "no-reply@tasktracker.local";
const UI_APP_URL = process.env.UI_APP_URL || process.env.FRONTEND_URL || "http://localhost:3001";
const OTP_EMAIL_WEBHOOK_URL = process.env.OTP_EMAIL_WEBHOOK_URL;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const SMTP_SERVICE = process.env.SMTP_SERVICE;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_TIMEOUT_MS = Math.min(
  parseInt(process.env.SMTP_TIMEOUT_MS || "10000", 10),
  30000,
);
const SMTP_IP_FAMILY = parseInt(process.env.SMTP_IP_FAMILY || "4", 10);
const EMAIL_HTTP_TIMEOUT_MS = Math.min(
  parseInt(process.env.EMAIL_HTTP_TIMEOUT_MS || "10000", 10),
  30000,
);
const EMAIL_RETRY_ATTEMPTS = parseInt(process.env.EMAIL_RETRY_ATTEMPTS || "3", 10);
const EMAIL_RETRY_BASE_DELAY_MS = parseInt(
  process.env.EMAIL_RETRY_BASE_DELAY_MS || "500",
  10,
);

let smtpTransporter: any = null;
let smtpTransporterKey: string | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logEmailError = (context: string, error: any) => {
  const status = error?.response?.status;
  const responseData = error?.response?.data;
  const code = error?.code;
  const message = error?.message || String(error);

  console.error(
    `[email] ${context} failed. status=${status ?? "n/a"} code=${code ?? "n/a"} message=${message} response=${responseData ? JSON.stringify(responseData) : "n/a"}`,
  );
};

const isRetryableEmailError = (error: any) => {
  const status = error?.response?.status;
  if (typeof status === "number") {
    return status >= 500 && status <= 599;
  }
  return Boolean(error?.code) || Boolean(error?.message);
};

const postWithRetries = async <T>(action: () => Promise<T>) => {
  let attempt = 0;
  let lastError: any;

  const maxAttempts = Math.max(1, EMAIL_RETRY_ATTEMPTS);
  const baseDelay = Math.max(100, EMAIL_RETRY_BASE_DELAY_MS);

  while (attempt < maxAttempts) {
    try {
      return await action();
    } catch (error: any) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts || !isRetryableEmailError(error)) {
        break;
      }
      const backoff = baseDelay * 2 ** (attempt - 1);
      await delay(backoff);
    }
  }

  throw lastError;
};

const getOtpExpiresMinutes = () => process.env.OTP_EXPIRES_MINUTES || "10";

const sendResendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing for email delivery");
  }

  await postWithRetries(() =>
    axios.post(
      "https://api.resend.com/emails",
      {
        from: OTP_FROM_EMAIL,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: EMAIL_HTTP_TIMEOUT_MS,
      },
    ),
  );
};

export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: "login" | "register" | "auth0" | "passwordReset",
) => {
  if (EMAIL_PROVIDER === "smtp") {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
    }

    try {
      await sendSmtpEmail({
        host: SMTP_HOST,
        port: SMTP_PORT,
        username: EMAIL_USER,
        password: EMAIL_PASS,
        from: OTP_FROM_EMAIL,
        to,
        subject: "Your TaskTracker OTP Code",
        html: buildOtpHtml(otp, purpose, getOtpExpiresMinutes(), UI_APP_URL),
      });
    } catch (error: any) {
      logEmailError("SMTP OTP", error);
      throw error;
    }
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    try {
      await sendResendEmail({
        to,
        subject: "Your TaskTracker OTP Code",
        html: buildOtpHtml(otp, purpose, getOtpExpiresMinutes(), UI_APP_URL),
      });
    } catch (error: any) {
      logEmailError("Resend OTP", error);
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Resend OTP failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject: "Your TaskTracker OTP Code",
          html: buildOtpHtml(otp, purpose, getOtpExpiresMinutes(), UI_APP_URL),
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (EMAIL_PROVIDER === "webhook") {
    if (!OTP_EMAIL_WEBHOOK_URL) {
      throw new Error("OTP_EMAIL_WEBHOOK_URL is missing for webhook email delivery");
    }

    const webhookHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.OTP_EMAIL_WEBHOOK_SECRET) {
      webhookHeaders["x-webhook-secret"] = process.env.OTP_EMAIL_WEBHOOK_SECRET;
    }

    try {
      await postWithRetries(() =>
        axios.post(
          OTP_EMAIL_WEBHOOK_URL,
          {
            to,
            subject: "Your TaskTracker OTP Code",
            html: buildOtpHtml(otp, purpose, getOtpExpiresMinutes(), UI_APP_URL),
            otp,
            purpose,
          },
          {
            headers: webhookHeaders,
            timeout: EMAIL_HTTP_TIMEOUT_MS,
          },
        ),
      );
    } catch (error: any) {
      logEmailError("Webhook OTP", error);
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Webhook OTP failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject: "Your TaskTracker OTP Code",
          html: buildOtpHtml(otp, purpose, getOtpExpiresMinutes(), UI_APP_URL),
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (appConfig.env !== "production") {
    console.warn(
      `OTP email provider '${EMAIL_PROVIDER}' not configured. No email sent to ${to}.`,
    );
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER '${EMAIL_PROVIDER}'`);
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  if (EMAIL_PROVIDER === "smtp") {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
    }

    await sendSmtpEmail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: EMAIL_USER,
      password: EMAIL_PASS,
      from: OTP_FROM_EMAIL,
      to,
      subject: "Reset your TaskTracker password",
      html: buildResetPasswordHtml(resetLink, UI_APP_URL),
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    try {
      await sendResendEmail({
        to,
        subject: "Reset your TaskTracker password",
        html: buildResetPasswordHtml(resetLink, UI_APP_URL),
      });
    } catch (error: any) {
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Resend password reset failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject: "Reset your TaskTracker password",
          html: buildResetPasswordHtml(resetLink, UI_APP_URL),
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (EMAIL_PROVIDER === "webhook") {
    if (!OTP_EMAIL_WEBHOOK_URL) {
      throw new Error("OTP_EMAIL_WEBHOOK_URL is missing for webhook email delivery");
    }

    try {
      await postWithRetries(() =>
        axios.post(
          OTP_EMAIL_WEBHOOK_URL,
          {
            to,
            subject: "Reset your TaskTracker password",
            html: buildResetPasswordHtml(resetLink, UI_APP_URL),
            resetLink,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: EMAIL_HTTP_TIMEOUT_MS,
          },
        ),
      );
    } catch (error: any) {
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Webhook password reset failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject: "Reset your TaskTracker password",
          html: buildResetPasswordHtml(resetLink, UI_APP_URL),
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (appConfig.env !== "production") {
    console.warn(
      `Email provider '${EMAIL_PROVIDER}' not configured. No reset email sent to ${to}.`,
    );
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER '${EMAIL_PROVIDER}'`);
};

export const sendWorkspaceInviteEmail = async (options: {
  to: string;
  fullName: string;
  contextType: "project" | "task";
  inviteToken: string;
  projectId?: string;
  taskId?: string;
}) => {
  const inviteUrl = `${UI_APP_URL}/signup?invite=${options.inviteToken}&type=${options.contextType}${
    options.projectId ? `&project=${options.projectId}` : ""
  }${options.taskId ? `&task=${options.taskId}` : ""}`;

  const subject = `TaskTracker ${options.contextType === "project" ? "Project" : "Task"} Invitation`;
  const html = buildInviteHtml({
    fullName: options.fullName,
    contextType: options.contextType,
    inviteUrl,
    appUrl: UI_APP_URL,
  });

  if (EMAIL_PROVIDER === "smtp") {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
    }
    await sendSmtpEmail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: EMAIL_USER,
      password: EMAIL_PASS,
      from: OTP_FROM_EMAIL,
      to: options.to,
      subject,
      html,
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    try {
      await sendResendEmail({
        to: options.to,
        subject,
        html,
      });
    } catch (error: any) {
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Resend invite failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to: options.to,
          subject,
          html,
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (appConfig.env !== "production") {
    console.warn(`Invite email provider '${EMAIL_PROVIDER}' not configured. No invite sent to ${options.to}.`);
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER '${EMAIL_PROVIDER}'`);
};

const sendSmtpEmail = async (options: {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) => {
  const transporter = getSmtpTransporter(options);

  await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

const getSmtpTransporter = (options: {
  host: string;
  port: number;
  username: string;
  password: string;
}) => {
  const key = `${SMTP_SERVICE ?? ""}:${options.host}:${options.port}:${options.username}`;
  if (smtpTransporter && smtpTransporterKey === key) {
    return smtpTransporter;
  }

  smtpTransporter = nodemailer.createTransport(
    SMTP_SERVICE
      ? {
          service: SMTP_SERVICE,
          auth: {
            user: options.username,
            pass: options.password,
          },
        }
      : {
          host: options.host,
          port: options.port,
          secure: options.port === 465,
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
          family: SMTP_IP_FAMILY === 6 ? 6 : 4,
          auth: {
            user: options.username,
            pass: options.password,
          },
          connectionTimeout: SMTP_TIMEOUT_MS,
          greetingTimeout: SMTP_TIMEOUT_MS,
          socketTimeout: SMTP_TIMEOUT_MS,
          dnsTimeout: SMTP_TIMEOUT_MS,
        },
  );
  smtpTransporterKey = key;

  return smtpTransporter;
};

export const sendWelcomeEmail = async (to: string, temporaryPassword: string, fullName: string) => {
  const subject = "Welcome to TaskTracker - Your Account Details";
  const html = buildWelcomeHtml(fullName, temporaryPassword, UI_APP_URL);

  if (EMAIL_PROVIDER === "smtp") {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
    }
    await sendSmtpEmail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: EMAIL_USER,
      password: EMAIL_PASS,
      from: OTP_FROM_EMAIL,
      to,
      subject,
      html,
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    try {
      await sendResendEmail({
        to,
        subject,
        html,
      });
    } catch (error: any) {
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Resend welcome email failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject,
          html,
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (appConfig.env !== "production") {
    console.warn(`Welcome email provider '${EMAIL_PROVIDER}' not configured. No welcome email sent to ${to}.`);
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER '${EMAIL_PROVIDER}'`);
};

export const sendSignupWelcomeEmail = async (to: string, fullName: string) => {
  const subject = "Welcome to TaskTracker";
  const html = buildSignupWelcomeHtml(fullName, UI_APP_URL);

  if (EMAIL_PROVIDER === "smtp") {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
    }
    await sendSmtpEmail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: EMAIL_USER,
      password: EMAIL_PASS,
      from: OTP_FROM_EMAIL,
      to,
      subject,
      html,
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    try {
      await sendResendEmail({
        to,
        subject,
        html,
      });
    } catch (error: any) {
      if (EMAIL_USER && EMAIL_PASS) {
        console.warn(
          `[email] Resend signup welcome failed after retries, falling back to SMTP. error=${error?.message || error}`,
        );
        await sendSmtpEmail({
          host: SMTP_HOST,
          port: SMTP_PORT,
          username: EMAIL_USER,
          password: EMAIL_PASS,
          from: OTP_FROM_EMAIL,
          to,
          subject,
          html,
        });
        return;
      }
      throw error;
    }
    return;
  }

  if (appConfig.env !== "production") {
    console.warn(`Welcome email provider '${EMAIL_PROVIDER}' not configured. No welcome email sent to ${to}.`);
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER '${EMAIL_PROVIDER}'`);
};
