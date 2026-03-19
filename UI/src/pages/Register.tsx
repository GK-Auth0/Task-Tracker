import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthNavbar from "../components/AuthNavbar";
import OtpVerification from "../components/OtpVerification";
import type { OtpChallenge } from "../services/auth";
import AuthShowcase from "../components/auth/AuthShowcase";
import AuthBackground from "../components/auth/AuthBackground";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [otpChallenge, setOtpChallenge] = useState<OtpChallenge | null>(null);

  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    if (!termsAccepted) {
      setError("Please accept the terms and conditions");
      setLoading(false);
      return;
    }

    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    const newFieldErrors: Record<string, string> = {};

    if (!trimFirst) {
      newFieldErrors.firstName = "First name is required";
    } else if (trimFirst.length < 2 || trimFirst.length > 50) {
      newFieldErrors.firstName = "First name must be between 2 and 50 characters";
    }

    if (!trimLast) {
      newFieldErrors.lastName = "Last name is required";
    } else if (trimLast.length < 2 || trimLast.length > 50) {
      newFieldErrors.lastName = "Last name must be between 2 and 50 characters";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const challenge = await register(email, password, trimFirst, trimLast);
      setOtpChallenge(challenge);
    } catch (error: any) {
      if (error?.code === "ECONNABORTED") {
        setError(
          "Registration request timed out. Please check backend and email configuration.",
        );
      } else {
        const apiErrors = error?.response?.data?.errors;
        if (Array.isArray(apiErrors)) {
          const parsedFieldErrors: Record<string, string> = {};
          apiErrors.forEach((item: any) => {
            if (item?.field && item?.message) {
              parsedFieldErrors[item.field] = item.message;
            }
          });
          if (Object.keys(parsedFieldErrors).length > 0) {
            setFieldErrors(parsedFieldErrors);
            setError(error.response?.data?.message || "Validation failed");
            return;
          }
        }

        setError(error.response?.data?.error || error.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setLoading(true);
      setError("");
      await verifyOtp(otpChallenge!.otpSessionId, otp);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError("");
      const refreshedChallenge = await resendOtp(otpChallenge!.otpSessionId);
      setOtpChallenge(refreshedChallenge);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-display transition-colors duration-300 relative isolate">
      <AuthNavbar buttonText="Log in" buttonLink="/login" />
      <AuthBackground />

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center py-8 px-4 sm:py-12">
        <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-2">
          <AuthShowcase
            title="Create Your Team Command Center"
            subtitle="Organize projects, assign responsibilities, and turn plans into execution with clear ownership."
            highlights={[
              { label: "Simple Start", value: "Set up in a minute", icon: "rocket_launch" },
              { label: "Clean Tracking", value: "Tasks with clear context", icon: "sync" },
              { label: "Better Focus", value: "Less clutter, more progress", icon: "visibility" },
            ]}
          />
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 className="text-slate-900 text-3xl font-bold mb-2">
                Create your account
              </h1>
              <p className="text-slate-500 text-sm">
                Join thousands of professional teams today.
              </p>
            </div>

            {/* Error Message (registration stage only; OTP stage handles its own errors) */}
            {error && !otpChallenge && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!otpChallenge ? (
              <>
                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* First Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-sm font-semibold">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="John"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <p className="text-red-600 text-xs mt-1">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-sm font-semibold">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="Doe"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                    {fieldErrors.lastName && (
                      <p className="text-red-600 text-xs mt-1">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-sm font-semibold">
                      Work Email
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="name@company.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-sm font-semibold">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="Min. 8 characters"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3 py-2">
                    <div className="flex items-center h-5">
                      <input
                        className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-600 focus:ring-2"
                        id="terms"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                    </div>
                    <label
                      className="text-sm text-slate-600 leading-tight"
                      htmlFor="terms"
                    >
                      I agree to the{" "}
                      <a
                        className="text-blue-600 font-medium hover:underline"
                        href="#"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        className="text-blue-600 font-medium hover:underline"
                        href="#"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              </>
            ) : (
              <OtpVerification
                email={otpChallenge.email}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                loading={loading}
                error={error}
              />
            )}

            {/* Footer Link */}
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-600 text-sm font-medium">
                Already have an account?{" "}
                <Link
                  className="text-blue-600 hover:underline ml-1"
                  to="/login"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="py-6 text-center">
        <p className="text-slate-400 text-xs">
          © 2026 Task Tracker Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
