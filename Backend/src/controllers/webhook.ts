import { Request, Response } from "express";
import nodemailer from "nodemailer";

const WEBHOOK_SECRET = process.env.OTP_EMAIL_WEBHOOK_SECRET || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
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
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const processOtpWebhook = async (req: Request, res: Response) => {
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
