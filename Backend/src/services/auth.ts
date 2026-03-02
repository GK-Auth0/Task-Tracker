import axios from "axios";
import bcrypt from "bcrypt";
import { createHash, createPublicKey, randomBytes, randomInt, randomUUID } from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { appConfig } from "../config/app";
import { AuthOtp, AuthPasswordReset, User, UserMetadata } from "../models";
import type { LoginDto, RegisterDto } from "../types/auth";
import { getIPGeolocation, parseUserAgent } from "./geolocation";
import { sendOtpEmail, sendPasswordResetEmail } from "./email";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || "10", 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || JWT_SECRET;
const RESET_TOKEN_EXPIRES_MINUTES = parseInt(
  process.env.RESET_TOKEN_EXPIRES_MINUTES || "30",
  10,
);
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:3001";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN;
const AUTH0_AUDIENCE =
  process.env.AUTH0_AUDIENCE || process.env.VITE_AUTH0_AUDIENCE;

type OtpPurpose = "login" | "register" | "auth0";

export interface OtpChallengeResult {
  requiresOtp: true;
  otpSessionId: string;
  email: string;
  expiresAt: string;
  otp?: string;
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
  return userWithoutPassword;
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

const sendOtpNotification = async (email: string, otp: string, purpose: OtpPurpose) => {
  await sendOtpEmail(email, otp, purpose);
};

const buildAuthSuccessResult = (user: User): AuthSuccessResult => {
  return {
    user: getUserWithoutPassword(user),
    token: issueJwtForUser(user),
  };
};

const createOtpChallengeForUser = async (
  user: User,
  purpose: OtpPurpose,
): Promise<OtpChallengeResult> => {
  await AuthOtp.update(
    {
      is_verified: true,
      verified_at: new Date(),
    },
    {
      where: {
        user_id: user.id,
        purpose,
        is_verified: false,
      },
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
  });

  await sendOtpNotification(user.email, otp, purpose);

  return {
    requiresOtp: true,
    otpSessionId: otpSession.id,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    ...(shouldExposeOtp() ? { otp } : {}),
  };
};

export async function registerUser(dto: RegisterDto): Promise<OtpChallengeResult> {
  const existingUser = await User.findOne({ where: { email: dto.email } });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await User.create({
    email: dto.email,
    password_hash: hashedPassword,
    full_name: `${dto.firstName} ${dto.lastName}`,
    role: "Member",
  });

  if (dto.ip) {
    const geoData = await getIPGeolocation(dto.ip);
    const userAgentData = dto.userAgent ? parseUserAgent(dto.userAgent) : {};

    await UserMetadata.create({
      user_id: user.id,
      ...geoData,
      ...userAgentData,
    });
  }

  return createOtpChallengeForUser(user, "register");
}

export async function loginUser(dto: LoginDto): Promise<AuthSuccessResult> {
  const user = await User.findOne({ where: { email: dto.email } });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Enforce OTP verification for accounts that were created via signup OTP flow.
  const registerOtpSessions = await AuthOtp.findAll({
    where: {
      user_id: user.id,
      purpose: "register",
    },
  });
  if (
    registerOtpSessions.length > 0 &&
    !registerOtpSessions.some((session) => session.is_verified)
  ) {
    throw new Error("Please verify your email OTP before logging in");
  }

  return buildAuthSuccessResult(user);
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

  return buildAuthSuccessResult(user);
}

export async function verifyOtpAndIssueToken(sessionId: string, otp: string) {
  const otpSession = await AuthOtp.findByPk(sessionId);

  if (!otpSession) {
    throw new Error("Invalid OTP session");
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

  const expectedHash = otpSession.otp_hash;
  const actualHash = hashOtp(otp);

  if (expectedHash !== actualHash) {
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

  return buildAuthSuccessResult(user);
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

  await sendOtpNotification(user.email, otp, otpSession.purpose);

  return {
    requiresOtp: true,
    otpSessionId: otpSession.id,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    ...(shouldExposeOtp() ? { otp } : {}),
  };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    return;
  }

  await AuthPasswordReset.update(
    {
      is_used: true,
      used_at: new Date(),
    },
    {
      where: {
        user_id: user.id,
        is_used: false,
      },
    },
  );

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );

  await AuthPasswordReset.create({
    user_id: user.id,
    token_hash: hashResetToken(rawToken),
    expires_at: expiresAt,
    is_used: false,
  });

  const resetLink = `${FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail(user.email, resetLink);
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
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return getUserWithoutPassword(user);
}
