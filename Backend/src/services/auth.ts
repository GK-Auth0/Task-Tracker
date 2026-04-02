import axios from "axios";
import bcrypt from "bcrypt";
import { createHash, createPublicKey, randomBytes, randomInt, randomUUID } from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import nodemailer from "nodemailer";
import { appConfig } from "../config/app";
import { AuthOtp, AuthPasswordReset, Organization, User, UserMetadata } from "../models";
import type { LoginDto, RegisterDto } from "../types/auth";
import { getIPGeolocation, parseUserAgent } from "./geolocation";
import { sendOtpEmail, sendPasswordResetEmail, sendSignupWelcomeEmail } from "./email";

const JWT_SECRET = appConfig.jwt.secret;
const JWT_EXPIRES_IN = appConfig.jwt.expiresIn || "7d";
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || "10", 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || JWT_SECRET;
const OTP_SEND_ASYNC_ON_REGISTER =
  (process.env.OTP_SEND_ASYNC_ON_REGISTER || "true").trim().toLowerCase() === "true";
const OTP_FAIL_OPEN_ON_REGISTER =
  (process.env.OTP_FAIL_OPEN_ON_REGISTER || "true").trim().toLowerCase() === "true";
const REGISTER_METADATA_ASYNC =
  (process.env.REGISTER_METADATA_ASYNC || "true").trim().toLowerCase() === "true";
const RESET_TOKEN_EXPIRES_MINUTES = parseInt(
  process.env.RESET_TOKEN_EXPIRES_MINUTES || "30",
  10,
);
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:3001";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const SMTP_SERVICE = process.env.SMTP_SERVICE;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_SECURE = (process.env.SMTP_SECURE || "").trim().toLowerCase();
const SMTP_TIMEOUT_MS = Math.min(parseInt(process.env.SMTP_TIMEOUT_MS || "10000", 10), 30000);
const SMTP_IP_FAMILY = parseInt(process.env.SMTP_IP_FAMILY || "4", 10);

let otpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
let otpTransporterKey: string | null = null;

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN;
const AUTH0_AUDIENCE =
  process.env.AUTH0_AUDIENCE || process.env.VITE_AUTH0_AUDIENCE;

type OtpPurpose = "login" | "register" | "auth0" | "passwordReset";

export interface OtpChallengeResult {
  requiresOtp: true;
  otpSessionId: string;
  email: string;
  expiresAt: string;
  otp?: string;
  resent?: boolean;
}

export interface AuthSuccessResult {
  user: ReturnType<typeof getUserWithoutPassword>;
  token: string;
}

type Auth0Jwk = {
  kid: string;
  kty: string;
  n?: string;
  e?: string;
  x5c?: string[];
};

type Auth0JwksResponse = {
  keys: Auth0Jwk[];
};

let auth0JwksCache: { keys: Auth0Jwk[]; expiresAt: number } | null = null;

const getAuth0Config = () => {
  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    throw new Error(
      "Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_AUDIENCE in backend env.",
    );
  }

  return {
    domain: AUTH0_DOMAIN,
    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
  };
};

const getUserWithoutPassword = (user: User) => {
  const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
  return {
    ...userWithoutPassword,
    organization: user.organization
      ? {
          id: user.organization.id,
          name: user.organization.name,
          org_code: user.organization.org_code,
          slug: user.organization.slug,
          status: user.organization.status,
          logo_url: user.organization.logo_url,
        }
      : null,
    onboardingRequired: !user.organization_id,
  };
};

const issueJwtForUser = (user: User) => {
  const tokenPayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

const fetchAuth0Jwks = async (): Promise<Auth0Jwk[]> => {
  const now = Date.now();
  if (auth0JwksCache && auth0JwksCache.expiresAt > now) {
    return auth0JwksCache.keys;
  }

  const { issuer } = getAuth0Config();
  const response = await axios.get<Auth0JwksResponse>(
    `${issuer}.well-known/jwks.json`,
  );

  auth0JwksCache = {
    keys: response.data.keys || [],
    expiresAt: now + 60 * 60 * 1000,
  };

  return auth0JwksCache.keys;
};

const getAuth0SigningPublicKey = async (kid: string): Promise<string> => {
  const keys = await fetchAuth0Jwks();
  const jwk = keys.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error("Unable to find Auth0 signing key");
  }

  if (jwk.x5c?.[0]) {
    return `-----BEGIN CERTIFICATE-----\n${jwk.x5c[0]}\n-----END CERTIFICATE-----`;
  }

  if (jwk.kty === "RSA" && jwk.n && jwk.e) {
    const keyObject = createPublicKey({
      key: {
        kty: "RSA",
        n: jwk.n,
        e: jwk.e,
      },
      format: "jwk",
    } as any);

    return keyObject.export({ format: "pem", type: "spki" }).toString();
  }

  throw new Error("Unsupported Auth0 signing key format");
};

const verifyAuth0AccessToken = async (accessToken: string): Promise<JwtPayload> => {
  const decoded = jwt.decode(accessToken, { complete: true }) as {
    header?: { kid?: string; alg?: string };
  } | null;

  if (!decoded?.header?.kid || decoded.header.alg !== "RS256") {
    throw new Error("Invalid Auth0 token header");
  }

  const signingKey = await getAuth0SigningPublicKey(decoded.header.kid);
  const { audience, issuer } = getAuth0Config();

  return jwt.verify(accessToken, signingKey, {
    algorithms: ["RS256"],
    audience,
    issuer,
  }) as JwtPayload;
};

const getAuth0Profile = async (accessToken: string) => {
  const { issuer } = getAuth0Config();
  const response = await axios.get(`${issuer}userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data as {
    email?: string;
    name?: string;
  };
};

const generateOtpCode = () => randomInt(100000, 1000000).toString();

const hashOtp = (otp: string) =>
  createHash("sha256").update(`${otp}:${OTP_HASH_SECRET}`).digest("hex");

const hashResetToken = (token: string) =>
  createHash("sha256").update(`${token}:${OTP_HASH_SECRET}`).digest("hex");

const shouldExposeOtp = () =>
  (process.env.OTP_EXPOSE_IN_RESPONSE || "").trim().toLowerCase() === "true";

const getOtpTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  const secure = SMTP_SECURE ? SMTP_SECURE === "true" : SMTP_PORT === 465;
  const key = JSON.stringify({
    EMAIL_USER,
    EMAIL_PASS,
    SMTP_SERVICE,
    SMTP_HOST,
    SMTP_PORT,
    secure,
    SMTP_TIMEOUT_MS,
    SMTP_IP_FAMILY,
  });

  if (!otpTransporter || otpTransporterKey !== key) {
    otpTransporterKey = key;
    otpTransporter = nodemailer.createTransport({
      service: SMTP_SERVICE || undefined,
      host: SMTP_SERVICE ? undefined : SMTP_HOST,
      port: SMTP_SERVICE ? undefined : SMTP_PORT,
      secure,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
      family: SMTP_IP_FAMILY,
    });
  }

  return otpTransporter;
};

const sendOtpNotification = async (email: string, otp: string, purpose: OtpPurpose) => {
  console.log(
    `[auth] OTP send requested (purpose=${purpose}, email=${email})`,
  );
  await sendOtpEmail(email, otp, purpose);
  console.log(
    `[auth] OTP send succeeded (purpose=${purpose}, email=${email})`,
  );
};

const sendOtpDirectEmail = async (
  email: string,
  otp: string,
  purpose: OtpPurpose,
) => {
  const transporter = getOtpTransporter();
  if (!transporter || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing for SMTP delivery");
  }

  const expiresIn = process.env.OTP_EXPIRES_MINUTES || "10";
  const subject =
    purpose === "passwordReset"
      ? "Your TaskTracker Password Reset OTP"
      : "Your TaskTracker OTP Code";

  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject,
    text: `Your OTP is ${otp}. It will expire in ${expiresIn} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">TaskTracker OTP Code</h2>
        <p style="margin: 0 0 12px;">Use the OTP below to complete your verification:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 14px 0; color: #2563eb;">
          ${otp}
        </div>
        <p style="margin: 0;">This OTP expires in ${expiresIn} minutes.</p>
      </div>
    `,
  });
};

const sendOtpWithFallback = async (
  email: string,
  otp: string,
  purpose: OtpPurpose,
) => {
  console.log(
    `[auth] OTP send via provider starting (purpose=${purpose}, email=${email})`,
  );
  try {
    await sendOtpNotification(email, otp, purpose);
    console.log(
      `[auth] OTP send via provider completed (purpose=${purpose}, email=${email})`,
    );
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[auth] OTP send via provider failed (purpose=${purpose}, email=${email}): ${message}`,
    );
  }

  console.log(
    `[auth] OTP send via SMTP fallback starting (purpose=${purpose}, email=${email})`,
  );
  const transporter = getOtpTransporter();
  if (transporter) {
    try {
      await sendOtpDirectEmail(email, otp, purpose);
      console.log(
        `[auth] OTP send via SMTP fallback completed (purpose=${purpose}, email=${email})`,
      );
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const code = (error as any)?.code;
      if (code === "ENETUNREACH") {
        console.warn(
          "[auth] SMTP network unreachable. If this is an IPv6 issue, set SMTP_IP_FAMILY=4 to force IPv4.",
        );
      }
      console.error(
        `[auth] Direct OTP email failed (purpose=${purpose}, email=${email}): ${message}`,
      );
    }
  } else {
    console.warn(
      "[auth] SMTP fallback is not configured. Set EMAIL_USER and EMAIL_PASS to enable it.",
    );
  }
};

const verifyOtpSession = async (
  sessionId: string,
  otp: string,
  expectedPurpose: OtpPurpose,
): Promise<User> => {
  const otpSession = await AuthOtp.findByPk(sessionId);

  if (!otpSession) {
    throw new Error("Invalid OTP session");
  }

  if (otpSession.purpose !== expectedPurpose) {
    throw new Error("Invalid OTP purpose");
  }

  if (otpSession.is_verified) {
    throw new Error("OTP already used");
  }

  if (new Date(otpSession.expires_at).getTime() < Date.now()) {
    throw new Error("OTP has expired");
  }

  if (otpSession.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("OTP retry limit exceeded. Please request a new code");
  }

  const actualHash = hashOtp(otp);
  if (actualHash !== otpSession.otp_hash) {
    otpSession.attempts += 1;
    await otpSession.save();
    throw new Error("Invalid OTP");
  }

  otpSession.is_verified = true;
  otpSession.verified_at = new Date();
  await otpSession.save();

  const user = await User.findByPk(otpSession.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const logOtpSendFailure = (email: string, purpose: OtpPurpose, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(
    `[auth] OTP email delivery failed (purpose=${purpose}, email=${email}): ${message}`,
  );
};

const logMetadataWriteFailure = (userId: string, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[auth] Failed to store registration metadata (userId=${userId}): ${message}`);
};

const buildAuthSuccessResult = (user: User): AuthSuccessResult => {
  return {
    user: getUserWithoutPassword(user),
    token: issueJwtForUser(user),
  };
};

const getAuthUserById = async (userId: string) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "org_code", "slug", "status", "logo_url"],
        required: false,
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const createOtpChallengeForUser = async (
  user: User,
  purpose: OtpPurpose,
  transaction?: any,
): Promise<OtpChallengeResult> => {
  await AuthOtp.update(
    {
      expires_at: new Date(),
      attempts: OTP_MAX_ATTEMPTS,
    },
    {
      where: {
        user_id: user.id,
        purpose,
        is_verified: false,
      },
      transaction,
    },
  );

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  const otpSession = await AuthOtp.create({
    user_id: user.id,
    purpose,
    otp_hash: hashOtp(otp),
    expires_at: expiresAt,
    attempts: 0,
    is_verified: false,
  }, { transaction });

  const shouldSendAsync = purpose === "register" ? true : false;

  if (shouldSendAsync) {
    console.log(
      `[auth] OTP send queued async (purpose=${purpose}, email=${user.email})`,
    );
    void sendOtpWithFallback(user.email, otp, purpose)
      .then(() => {
        console.log(
          `[auth] OTP send async completed (purpose=${purpose}, email=${user.email})`,
        );
      })
      .catch((error) => {
        logOtpSendFailure(user.email, purpose, error);
      });
  } else {
    try {
      console.log(
        `[auth] OTP send starting (purpose=${purpose}, email=${user.email})`,
      );
      await sendOtpWithFallback(user.email, otp, purpose);
      console.log(
        `[auth] OTP send completed (purpose=${purpose}, email=${user.email})`,
      );
    } catch (error) {
      if (purpose === "register" && OTP_FAIL_OPEN_ON_REGISTER) {
        logOtpSendFailure(user.email, purpose, error);
      } else {
        throw error;
      }
    }
  }

  return {
    requiresOtp: true,
    otpSessionId: otpSession.id,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    ...(shouldExposeOtp() ? { otp } : {}),
  };
};

const getRegisterOtpStatus = async (userId: string): Promise<"none" | "pending" | "verified"> => {
  const sessions = await AuthOtp.findAll({
    where: {
      user_id: userId,
      purpose: "register",
    },
  });
  if (sessions.length === 0) return "none";
  if (sessions.some((session) => session.is_verified)) return "verified";
  return "pending";
};

export async function registerUser(dto: RegisterDto, transaction: any): Promise<OtpChallengeResult> {
  const existingUser = await User.findOne({ 
    where: { email: dto.email },
    transaction 
  });

  if (existingUser) {
    const status = await getRegisterOtpStatus(existingUser.id);
    if (status === "pending") {
      const challenge = await createOtpChallengeForUser(existingUser, "register", transaction);
      return { ...challenge, resent: true };
    }
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await User.create({
    email: dto.email,
    password_hash: hashedPassword,
    full_name: `${dto.firstName} ${dto.lastName}`,
    role: "Member",
  }, { transaction });

  if (dto.ip) {
    const writeMetadata = async (useTransaction: boolean) => {
      const geoData = await getIPGeolocation(dto.ip as string);
      const userAgentData = dto.userAgent ? parseUserAgent(dto.userAgent) : {};

      await UserMetadata.create(
        {
          user_id: user.id,
          ...geoData,
          ...userAgentData,
        },
        useTransaction ? { transaction } : undefined,
      );
    };

    if (REGISTER_METADATA_ASYNC) {
      void writeMetadata(false).catch((error) => {
        logMetadataWriteFailure(user.id, error);
      });
    } else {
      await writeMetadata(true);
    }
  }

  return createOtpChallengeForUser(user, "register", transaction);
}

export async function loginUser(
  dto: LoginDto,
): Promise<
  | AuthSuccessResult
  | { requiresPasswordChange: true; email: string }
  | OtpChallengeResult
> {
  const user = await User.findOne({ where: { email: dto.email } });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Check if password reset is required (for invited users)
  if (user.password_reset_required) {
    return {
      requiresPasswordChange: true,
      email: user.email,
    };
  }

  const registerOtpStatus = await getRegisterOtpStatus(user.id);
  if (registerOtpStatus === "pending") {
    return createOtpChallengeForUser(user, "register");
  }

  const hydratedUser = await getAuthUserById(user.id);
  return buildAuthSuccessResult(hydratedUser);
}

export async function loginWithAuth0AccessToken(
  accessToken: string,
): Promise<AuthSuccessResult> {
  await verifyAuth0AccessToken(accessToken);

  const auth0Profile = await getAuth0Profile(accessToken);
  const email = auth0Profile.email?.trim().toLowerCase();
  const fullName = auth0Profile.name?.trim();

  if (!email) {
    throw new Error("Unable to read email from Auth0 profile");
  }

  let user = await User.findOne({ where: { email } });

  if (!user) {
    const generatedName =
      fullName && fullName.length > 0 ? fullName : email.split("@")[0];

    user = await User.create({
      email,
      password_hash: await bcrypt.hash(randomUUID(), 10),
      full_name: generatedName,
      role: "Member",
    });
  }

  const hydratedUser = await getAuthUserById(user.id);
  return buildAuthSuccessResult(hydratedUser);
}

export async function verifyOtpAndIssueToken(sessionId: string, otp: string) {
  const user = await verifyOtpSession(sessionId, otp, "register");

  try {
    await sendSignupWelcomeEmail(user.email, user.full_name || "there");
  } catch (error) {
    console.error(
      `[auth] Failed to send signup welcome email (userId=${user.id}): ${
        (error as any)?.message || error
      }`,
    );
  }

  const hydratedUser = await getAuthUserById(user.id);
  return buildAuthSuccessResult(hydratedUser);
}

export async function resendOtp(sessionId: string): Promise<OtpChallengeResult> {
  const otpSession = await AuthOtp.findByPk(sessionId);

  if (!otpSession) {
    throw new Error("Invalid OTP session");
  }

  if (otpSession.is_verified) {
    throw new Error("OTP session already verified");
  }

  const user = await User.findByPk(otpSession.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  otpSession.otp_hash = hashOtp(otp);
  otpSession.expires_at = expiresAt;
  otpSession.attempts = 0;
  await otpSession.save();

  const purpose = otpSession.purpose as OtpPurpose;
  const shouldSendAsync = purpose === "register" ? true : false;

  if (shouldSendAsync) {
    console.log(
      `[auth] OTP resend queued async (purpose=${purpose}, email=${user.email})`,
    );
    void sendOtpWithFallback(user.email, otp, purpose)
      .then(() => {
        console.log(
          `[auth] OTP resend async completed (purpose=${purpose}, email=${user.email})`,
        );
      })
      .catch((error) => {
        logOtpSendFailure(user.email, purpose, error);
      });
  } else {
    try {
      console.log(
        `[auth] OTP resend starting (purpose=${purpose}, email=${user.email})`,
      );
      await sendOtpWithFallback(user.email, otp, purpose);
      console.log(
        `[auth] OTP resend completed (purpose=${purpose}, email=${user.email})`,
      );
    } catch (error) {
      if (purpose === "register" && OTP_FAIL_OPEN_ON_REGISTER) {
        logOtpSendFailure(user.email, purpose, error);
      } else {
        throw error;
      }
    }
  }

  return {
    requiresOtp: true,
    otpSessionId: otpSession.id,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    ...(shouldExposeOtp() ? { otp } : {}),
  };
}

export async function requestPasswordReset(email: string): Promise<OtpChallengeResult | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    return;
  }

  const result = await createOtpChallengeForUser(user, "passwordReset");
  return result;
}

export async function resetPasswordWithOtp(
  otpSessionId: string,
  otp: string,
  newPassword: string,
) {
  const user = await verifyOtpSession(otpSessionId, otp, "passwordReset");
  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const tokenHash = hashResetToken(token);
  const resetSession = await AuthPasswordReset.findOne({
    where: { token_hash: tokenHash },
    order: [["created_at", "DESC"]],
  });

  if (!resetSession) {
    throw new Error("Invalid or expired reset token");
  }

  if (resetSession.is_used) {
    throw new Error("Reset token has already been used");
  }

  if (new Date(resetSession.expires_at).getTime() < Date.now()) {
    throw new Error("Reset token has expired");
  }

  const user = await User.findByPk(resetSession.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();

  resetSession.is_used = true;
  resetSession.used_at = new Date();
  await resetSession.save();
}

export async function getCurrentUser(userId: string) {
  const user = await getAuthUserById(userId);
  return getUserWithoutPassword(user);
}

export async function changePasswordForInvitedUser(
  email: string,
  newPassword: string
): Promise<void> {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password_reset_required) {
    throw new Error("Password reset not required for this user");
  }

  // Update password and remove reset requirement
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({
    password_hash: hashedPassword,
    password_reset_required: false,
  });
}
