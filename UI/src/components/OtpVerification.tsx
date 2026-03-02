import React, { useState } from "react";

interface OtpVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading: boolean;
  error: string;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  onVerify,
  onResend,
  loading,
  error,
}) => {
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [localError, setLocalError] = useState("");

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!/^[0-9]{6}$/.test(otp)) {
      setLocalError("Enter a valid 6-digit OTP");
      return;
    }

    await onVerify(otp);
  };

  const resendCode = async () => {
    setResending(true);
    setLocalError("");
    try {
      await onResend();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Verify OTP</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      {(error || localError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error || localError}
        </div>
      )}

      <form onSubmit={submitOtp} className="space-y-3">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="w-full h-12 rounded-lg border border-slate-300 px-4 text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          inputMode="numeric"
          maxLength={6}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <button
        type="button"
        onClick={resendCode}
        disabled={resending || loading}
        className="w-full h-10 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
      >
        {resending ? "Resending..." : "Resend OTP"}
      </button>
    </div>
  );
};

export default OtpVerification;
