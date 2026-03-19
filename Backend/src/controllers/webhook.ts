import { Request, Response } from "express";
import nodemailer from "nodemailer";

const WEBHOOK_SECRET = process.env.OTP_EMAIL_WEBHOOK_SECRET || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);
const SMTP_IP_FAMILY = Number(process.env.SMTP_IP_FAMILY || 4);
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || "TaskTracker <no-reply@tasktracker.local>";

const getSmtpTransport = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP credentials are not configured for webhook email delivery");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    family: SMTP_IP_FAMILY === 6 ? 6 : 4,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    dnsTimeout: SMTP_TIMEOUT_MS,
  });
};

export const processOtpWebhook = async (req: Request, res: Response) => {
  console.log("[webhook] OTP request received", {
    to: req.body?.to,
    subject: req.body?.subject,
    hasHtml: Boolean(req.body?.html),
  });
  if (WEBHOOK_SECRET && req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized webhook request" });
  }

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, message: "Missing required fields: to, subject, html" });
  }

  try {
    const transporter = getSmtpTransport();

    await transporter.sendMail({
      from: OTP_FROM_EMAIL,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, message: "OTP email sent" });
  } catch (error) {
    console.error("[webhook] OTP email sending failed", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP email", error: (error as Error).message });
  }
};
