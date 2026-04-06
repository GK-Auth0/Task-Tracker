import { Request, Response } from "express";
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  verifyOtp,
} from "../controllers/auth";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyOtpAndIssueToken,
  createRefreshSession,
} from "../services/auth";

jest.mock("../helpers/validation", () => ({
  handleValidationErrors: jest.fn(() => false),
}));

jest.mock("../services/auth", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getCurrentUser: jest.fn(),
  verifyOtpAndIssueToken: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPasswordWithOtp: jest.fn(),
  loginWithAuth0AccessToken: jest.fn(),
  resendOtp: jest.fn(),
  changePasswordForInvitedUser: jest.fn(),
  createRefreshSession: jest.fn(),
  refreshAuthSession: jest.fn(),
  revokeRefreshSession: jest.fn(),
}));

jest.mock("../config/database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

const sequelize = require("../config/database").default as {
  transaction: jest.Mock;
};

const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedVerifyOtpAndIssueToken =
  verifyOtpAndIssueToken as jest.MockedFunction<typeof verifyOtpAndIssueToken>;
const mockedRequestPasswordReset =
  requestPasswordReset as jest.MockedFunction<typeof requestPasswordReset>;
const mockedResetPasswordWithOtp =
  resetPasswordWithOtp as jest.MockedFunction<typeof resetPasswordWithOtp>;
const mockedCreateRefreshSession =
  createRefreshSession as jest.MockedFunction<typeof createRefreshSession>;

const createResponseMock = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const cookie = jest.fn();
  const clearCookie = jest.fn();

  return {
    status,
    json,
    cookie,
    clearCookie,
    response: { status, json, cookie, clearCookie } as unknown as Response,
  };
};

describe("auth controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateRefreshSession.mockResolvedValue({
      token: "refresh-token",
      sessionId: "11111111-1111-1111-1111-111111111111",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("register returns 201 and commits the transaction", async () => {
    const transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(transaction);
    mockedRegisterUser.mockResolvedValue({
      requiresOtp: true,
      otpSessionId: "otp-123",
      email: "john@example.com",
      expiresAt: "2026-01-01T00:00:00.000Z",
    });

    const req = {
      body: {
        email: "john@example.com",
        password: "secret123",
        firstName: "John",
        lastName: "Doe",
      },
      headers: {
        "user-agent": "jest-agent",
      },
      ip: "127.0.0.1",
      connection: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await register(req, response);

    expect(mockedRegisterUser).toHaveBeenCalledWith(
      {
        email: "john@example.com",
        password: "secret123",
        firstName: "John",
        lastName: "Doe",
        ip: "127.0.0.1",
        userAgent: "jest-agent",
      },
      transaction,
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Registration initiated. OTP verification required",
      data: {
        requiresOtp: true,
        otpSessionId: "otp-123",
        email: "john@example.com",
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("login returns 200 on success", async () => {
    mockedLoginUser.mockResolvedValue({
      token: "jwt-token",
      user: { id: "user-1", email: "john@example.com" } as any,
    });

    const req = {
      body: {
        email: "john@example.com",
        password: "secret123",
      },
      headers: {},
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await login(req, response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Login successful",
      data: {
        token: "jwt-token",
        user: { id: "user-1", email: "john@example.com" },
      },
    });
  });

  it("verifyOtp returns 200 on success", async () => {
    mockedVerifyOtpAndIssueToken.mockResolvedValue({
      token: "jwt-token",
      user: { id: "user-1", email: "john@example.com" } as any,
    });

    const req = {
      body: {
        otpSessionId: "otp-123",
        otp: "123456",
      },
      headers: {},
    } as unknown as Request;
    const { response, status } = createResponseMock();

    await verifyOtp(req, response);

    expect(mockedVerifyOtpAndIssueToken).toHaveBeenCalledWith("otp-123", "123456");
    expect(status).toHaveBeenCalledWith(200);
  });

  it("forgotPassword returns 200 on success", async () => {
    mockedRequestPasswordReset.mockResolvedValue({
      requiresOtp: true,
      otpSessionId: "otp-123",
      email: "john@example.com",
      expiresAt: "2026-01-01T00:00:00.000Z",
    });

    const req = {
      body: {
        email: "john@example.com",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await forgotPassword(req, response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "OTP sent to the provided email if it exists.",
      data: {
        requiresOtp: true,
        otpSessionId: "otp-123",
        email: "john@example.com",
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("resetPassword returns 200 on success", async () => {
    mockedResetPasswordWithOtp.mockResolvedValue(undefined);

    const req = {
      body: {
        otpSessionId: "otp-123",
        otp: "123456",
        newPassword: "newSecret123",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await resetPassword(req, response);

    expect(mockedResetPasswordWithOtp).toHaveBeenCalledWith(
      "otp-123",
      "123456",
      "newSecret123",
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Password reset successful",
    });
  });

  it("me returns 401 when user id is missing", async () => {
    const req = {
      user: undefined,
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await me(req, response);

    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "User ID required",
      error: "UNAUTHORIZED",
    });
  });
});
