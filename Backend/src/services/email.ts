import axios from "axios";
import nodemailer from "nodemailer";
import { appConfig } from "../config/app";

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || "no-reply@tasktracker.local";
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

const buildOtpHtml = (otp: string, purpose: string) => {
  const purposeDescription =
    purpose === "passwordReset"
      ? "password reset"
      : `${purpose} verification`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">TaskTracker OTP Code</h2>
      <p style="margin: 0 0 12px;">Use the OTP below to complete your ${purposeDescription}:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 14px 0; color: #2563eb;">
        ${otp}
      </div>
      <p style="margin: 0 0 6px;">This OTP expires in ${process.env.OTP_EXPIRES_MINUTES || "10"} minutes.</p>
      <p style="margin: 0; color: #64748b;">If you did not request this code, please ignore this email.</p>
    </div>
  `;
};

const buildResetPasswordHtml = (resetLink: string) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">TaskTracker Password Reset</h2>
      <p style="margin: 0 0 12px;">Click the button below to reset your password.</p>
      <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600;">
        Reset Password
      </a>
      <p style="margin: 16px 0 6px;">If the button does not work, use this link:</p>
      <p style="margin: 0; word-break: break-all; color: #334155;">${resetLink}</p>
      <p style="margin: 16px 0 0; color: #64748b;">If you did not request this, please ignore this email.</p>
    </div>
  `;
};

const buildInviteHtml = (options: {
  fullName: string;
  contextType: "project" | "task";
  inviteUrl: string;
}) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">You're Invited to TaskTracker</h2>
    <p style="margin: 0 0 12px;">Hi ${options.fullName},</p>
    <p style="margin: 0 0 12px;">
      You were invited to collaborate on a ${options.contextType} in TaskTracker.
    </p>
    <a href="${options.inviteUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600;">
      Accept Invitation
    </a>
    <p style="margin: 16px 0 6px;">If the button does not work, use this link:</p>
    <p style="margin: 0; word-break: break-all; color: #334155;">${options.inviteUrl}</p>
  </div>
`;

const buildWelcomeHtml = (fullName: string, temporaryPassword: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">Welcome to TaskTracker!</h2>
    <p style="margin: 0 0 12px;">Hi ${fullName},</p>
    <p style="margin: 0 0 12px;">
      Your TaskTracker account has been created successfully. Here are your login credentials:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600;">Temporary Password:</p>
      <p style="margin: 0; font-family: monospace; font-size: 16px; color: #2563eb; font-weight: 700;">${temporaryPassword}</p>
    </div>
    <p style="margin: 16px 0 12px; color: #dc2626; font-weight: 600;">
      ⚠️ Important: You must change this password on your first login for security.
    </p>
    <p style="margin: 0 0 12px;">
      Please log in to TaskTracker and set up your new password.
    </p>
    <p style="margin: 16px 0 0; color: #64748b;">
      If you have any questions, please contact your administrator.
    </p>
  </div>
`;

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
        html: buildOtpHtml(otp, purpose),
      });
    } catch (error: any) {
      logEmailError("SMTP OTP", error);
      throw error;
    }
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing for OTP email delivery");
    }

    try {
      await postWithRetries(() =>
        axios.post(
          "https://api.resend.com/emails",
          {
            from: OTP_FROM_EMAIL,
            to: [to],
            subject: "Your TaskTracker OTP Code",
            html: buildOtpHtml(otp, purpose),
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
          html: buildOtpHtml(otp, purpose),
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
            html: buildOtpHtml(otp, purpose),
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
          html: buildOtpHtml(otp, purpose),
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
      html: buildResetPasswordHtml(resetLink),
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing for email delivery");
    }

    try {
      await postWithRetries(() =>
        axios.post(
          "https://api.resend.com/emails",
          {
            from: OTP_FROM_EMAIL,
            to: [to],
            subject: "Reset your TaskTracker password",
            html: buildResetPasswordHtml(resetLink),
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
          html: buildResetPasswordHtml(resetLink),
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
            html: buildResetPasswordHtml(resetLink),
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
          html: buildResetPasswordHtml(resetLink),
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
  const appUrl = process.env.UI_APP_URL || "http://localhost:3001";
  const inviteUrl = `${appUrl}/signup?invite=${options.inviteToken}&type=${options.contextType}${
    options.projectId ? `&project=${options.projectId}` : ""
  }${options.taskId ? `&task=${options.taskId}` : ""}`;

  const subject = `TaskTracker ${options.contextType === "project" ? "Project" : "Task"} Invitation`;
  const html = buildInviteHtml({
    fullName: options.fullName,
    contextType: options.contextType,
    inviteUrl,
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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing for email delivery");
    }
    try {
      await postWithRetries(() =>
        axios.post(
          "https://api.resend.com/emails",
          {
            from: OTP_FROM_EMAIL,
            to: [options.to],
            subject,
            html,
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
  const html = buildWelcomeHtml(fullName, temporaryPassword);

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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing for email delivery");
    }
    try {
      await postWithRetries(() =>
        axios.post(
          "https://api.resend.com/emails",
          {
            from: OTP_FROM_EMAIL,
            to: [to],
            subject,
            html,
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
