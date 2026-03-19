import axios from "axios";
import nodemailer from "nodemailer";
import { appConfig } from "../config/app";

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || "no-reply@tasktracker.local";
const OTP_EMAIL_WEBHOOK_URL = process.env.OTP_EMAIL_WEBHOOK_URL;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_TIMEOUT_MS = parseInt(process.env.SMTP_TIMEOUT_MS || "10000", 10);
const SMTP_IP_FAMILY = parseInt(process.env.SMTP_IP_FAMILY || "4", 10);
const EMAIL_HTTP_TIMEOUT_MS = parseInt(process.env.EMAIL_HTTP_TIMEOUT_MS || "10000", 10);

let smtpTransporter: any = null;
let smtpTransporterKey: string | null = null;

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

export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: "login" | "register" | "auth0" | "passwordReset",
) => {
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
      subject: "Your TaskTracker OTP Code",
      html: buildOtpHtml(otp, purpose),
    });
    return;
  }

  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing for OTP email delivery");
    }

    await axios.post(
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
    );
    return;
  }

  if (EMAIL_PROVIDER === "webhook") {
    if (!OTP_EMAIL_WEBHOOK_URL) {
      throw new Error("OTP_EMAIL_WEBHOOK_URL is missing for webhook email delivery");
    }

    await axios.post(
      OTP_EMAIL_WEBHOOK_URL,
      {
        to,
        subject: "Your TaskTracker OTP Code",
        html: buildOtpHtml(otp, purpose),
        otp,
        purpose,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: EMAIL_HTTP_TIMEOUT_MS,
      },
    );
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

    await axios.post(
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
    );
    return;
  }

  if (EMAIL_PROVIDER === "webhook") {
    if (!OTP_EMAIL_WEBHOOK_URL) {
      throw new Error("OTP_EMAIL_WEBHOOK_URL is missing for webhook email delivery");
    }

    await axios.post(
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
    );
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
    await axios.post(
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
    );
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
  const key = `${options.host}:${options.port}:${options.username}`;
  if (smtpTransporter && smtpTransporterKey === key) {
    return smtpTransporter;
  }

  smtpTransporter = nodemailer.createTransport({
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
  } as any);
  smtpTransporterKey = key;

  return smtpTransporter;
};
