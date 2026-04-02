import bcrypt from "bcrypt";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import {
  getCurrentUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithOtp,
} from "../services/auth";
import { appConfig } from "../config/app";
import { AuthOtp, User } from "../models";

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    decode: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock("../models", () => ({
  AuthOtp: {
    findAll: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  AuthPasswordReset: {
    findOne: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  UserMetadata: {
    create: jest.fn(),
  },
}));

jest.mock("../services/geolocation", () => ({
  getIPGeolocation: jest.fn(),
  parseUserAgent: jest.fn(),
}));

jest.mock("../services/email", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendSignupWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedAuthOtp = AuthOtp as jest.Mocked<typeof AuthOtp>;
const mockedUser = User as jest.Mocked<typeof User>;

const buildUser = (overrides: Record<string, unknown> = {}) => {
  const plainUser = {
    id: "user-123",
    email: "john@example.com",
    full_name: "John Doe",
    role: "Member",
    password_hash: "hashed-password",
    password_reset_required: false,
    ...overrides,
  };

  return {
    ...plainUser,
    get: jest.fn(() => plainUser),
    save: jest.fn().mockResolvedValue(undefined),
  };
};

describe("auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedJwt.sign.mockReturnValue("jwt-token" as never);
  });

  it("loginUser returns auth success when credentials are valid", async () => {
    const user = buildUser();
    mockedUser.findOne.mockResolvedValue(user as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedAuthOtp.findAll.mockResolvedValue([] as never);

    const result = await loginUser({
      email: "john@example.com",
      password: "secret123",
    });

    expect(result).toEqual({
      token: "jwt-token",
      user: {
        id: "user-123",
        email: "john@example.com",
        full_name: "John Doe",
        role: "Member",
        password_reset_required: false,
      },
    });
  });

  it("loginUser returns password change requirement for invited users", async () => {
    const user = buildUser({ password_reset_required: true });
    mockedUser.findOne.mockResolvedValue(user as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await loginUser({
      email: "john@example.com",
      password: "secret123",
    });

    expect(result).toEqual({
      requiresPasswordChange: true,
      email: "john@example.com",
    });
  });

  it("requestPasswordReset normalizes email and returns undefined when user is missing", async () => {
    mockedUser.findOne.mockResolvedValue(null as never);

    const result = await requestPasswordReset("  JOHN@EXAMPLE.COM  ");

    expect(mockedUser.findOne).toHaveBeenCalledWith({
      where: { email: "john@example.com" },
    });
    expect(result).toBeUndefined();
  });

  it("requestPasswordReset returns an OTP challenge when user exists", async () => {
    const user = buildUser();
    mockedUser.findOne.mockResolvedValue(user as never);
    mockedAuthOtp.update.mockResolvedValue([0] as never);
    mockedAuthOtp.create.mockResolvedValue({ id: "otp-123" } as never);

    const result = await requestPasswordReset("john@example.com");

    expect(mockedAuthOtp.update).toHaveBeenCalled();
    expect(mockedAuthOtp.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        requiresOtp: true,
        otpSessionId: "otp-123",
        email: "john@example.com",
      }),
    );
  });

  it("getCurrentUser removes the password hash from the response", async () => {
    const user = buildUser();
    mockedUser.findByPk.mockResolvedValue(user as never);

    const result = await getCurrentUser("user-123");

    expect(result).toEqual({
      id: "user-123",
      email: "john@example.com",
      full_name: "John Doe",
      role: "Member",
      password_reset_required: false,
    });
  });

  it("resetPasswordWithOtp updates the user password after OTP verification", async () => {
    const otp = "123456";
    const otpHashSecret = process.env.OTP_HASH_SECRET || appConfig.jwt.secret;
    const otpHash = createHash("sha256").update(`${otp}:${otpHashSecret}`).digest("hex");
    const otpSession = {
      id: "otp-123",
      user_id: "user-123",
      purpose: "passwordReset",
      is_verified: false,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      attempts: 0,
      otp_hash: otpHash,
      verified_at: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const user = buildUser();

    mockedAuthOtp.findByPk.mockResolvedValue(otpSession as never);
    mockedUser.findByPk.mockResolvedValue(user as never);
    mockedBcrypt.hash.mockResolvedValue("hashed-new-password" as never);

    await resetPasswordWithOtp("otp-123", otp, "newSecret123");

    expect(user.password_hash).toBe("hashed-new-password");
    expect(otpSession.save).toHaveBeenCalled();
    expect(user.save).toHaveBeenCalled();
  });
});
