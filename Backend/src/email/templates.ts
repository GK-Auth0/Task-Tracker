const buildAppCta = (appUrl: string, label: string) => `
  <a href="${appUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600;">
    ${label}
  </a>
`;

export const buildOtpHtml = (
  otp: string,
  purpose: string,
  expiresMinutes: string,
  appUrl: string,
) => {
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
      <p style="margin: 0 0 6px;">This OTP expires in ${expiresMinutes} minutes.</p>
      <div style="margin: 16px 0 0;">
        ${buildAppCta(appUrl, "Open TaskTracker")}
      </div>
      <p style="margin: 0; color: #64748b;">If you did not request this code, please ignore this email.</p>
    </div>
  `;
};

export const buildResetPasswordHtml = (resetLink: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">TaskTracker Password Reset</h2>
    <p style="margin: 0 0 12px;">Click the button below to reset your password.</p>
    <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600;">
      Reset Password
    </a>
    <p style="margin: 16px 0 0; color: #64748b;">If you did not request this, please ignore this email.</p>
  </div>
`;

export const buildInviteHtml = (options: {
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
  </div>
`;

export const buildWelcomeHtml = (
  fullName: string,
  temporaryPassword: string,
  appUrl: string,
  orgCode?: string,
) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">Welcome to TaskTracker!</h2>
    <p style="margin: 0 0 12px;">Hi ${fullName},</p>
    <p style="margin: 0 0 12px;">
      Your TaskTracker account has been created successfully. Here are your login credentials:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600;">Temporary Password:</p>
      <p style="margin: 0; font-family: monospace; font-size: 16px; color: #2563eb; font-weight: 700;">${temporaryPassword}</p>
      ${
        orgCode
          ? `<p style="margin: 16px 0 8px; font-weight: 600;">Your organization access code:</p>
      <p style="margin: 0; font-family: monospace; font-size: 16px; color: #0f172a; font-weight: 700; letter-spacing: 2px;">${orgCode}</p>`
          : ""
      }
    </div>
    <p style="margin: 16px 0 12px; color: #dc2626; font-weight: 600;">
      ⚠️ Important: You must change this password on your first login for security.
    </p>
    <p style="margin: 0 0 12px;">
      Please log in to TaskTracker and set up your new password.
    </p>
    <div style="margin: 16px 0 0;">
      ${buildAppCta(appUrl, "Go to TaskTracker")}
    </div>
    <p style="margin: 16px 0 0; color: #64748b;">
      If you have any questions, please contact your administrator.
    </p>
  </div>
`;

export const buildSignupWelcomeHtml = (fullName: string, appUrl: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin: 0 0 12px;">Welcome to TaskTracker!</h2>
    <p style="margin: 0 0 12px;">Hi ${fullName},</p>
    <p style="margin: 0 0 12px;">
      Your account is verified and ready to go. You can now start organizing projects,
      assigning tasks, and collaborating with your team.
    </p>
    <p style="margin: 0 0 12px;">
      If you have any questions, just reply to this email.
    </p>
    <div style="margin: 16px 0 0;">
      ${buildAppCta(appUrl, "Open TaskTracker")}
    </div>
    <p style="margin: 0; color: #64748b;">Thanks for joining TaskTracker.</p>
  </div>
`;
