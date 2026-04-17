export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ip?: string;
  userAgent?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  otpSessionId: string;
  otp: string;
}

export interface ResendOtpDto {
  otpSessionId: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  otpSessionId: string;
  otp: string;
  newPassword: string;
}

export interface updateUserDto {
  userId: string
  firstName: string;
  lastName: string
}
