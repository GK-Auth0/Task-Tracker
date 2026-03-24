import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { OtpChallenge } from "../services/auth";
import AuthNavbar from "../components/AuthNavbar";
import { isAuth0Visible, startAuth0Login } from "../config/auth0";
import AuthShowcase from "../components/auth/AuthShowcase";
import AuthBackground from "../components/auth/AuthBackground";
import RingLoader from "../components/RingLoader";
import OtpVerification from "../components/OtpVerification";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [auth0Loading, setAuth0Loading] = useState(false);
  const [error, setError] = useState("");
  const [otpChallenge, setOtpChallenge] = useState<OtpChallenge | null>(null);
  const [otpInfo, setOtpInfo] = useState("");
  const [showOtpInfo, setShowOtpInfo] = useState(true);

  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showAuth0 = isAuth0Visible();
  const message = location.state?.message;

  useEffect(() => {
    if (!showOtpInfo || !otpInfo) return;
    const timer = setTimeout(() => setShowOtpInfo(false), 5000);
    return () => clearTimeout(timer);
  }, [showOtpInfo, otpInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error: any) {
      if (error?.code === "OTP_REQUIRED") {
        setOtpChallenge(error?.data || null);
        setError("");
        setOtpInfo("OTP verification required. We sent a code to your email.");
        setShowOtpInfo(true);
        if (error?.data?.resent) {
          setOtpInfo("We found an unverified account — OTP sent again.");
          setShowOtpInfo(true);
        } else {
          setOtpInfo("OTP verification required. We sent a code to your email.");
        }
        return;
      }
      if (error.message === "PASSWORD_CHANGE_REQUIRED") {
        navigate("/change-password", { state: { email } });
        return;
      }
      
      if (error?.code === "ECONNABORTED") {
        setError("Login request timed out. Please check backend and email configuration.");
      } else {
        setError(error.response?.data?.error || "Login failed");
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
      const refreshed = await resendOtp(otpChallenge!.otpSessionId);
      setOtpChallenge(refreshed);
      setOtpInfo("We found an unverified account — OTP sent again.");
      setShowOtpInfo(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to resend OTP");
    }
  };

  const handleAuth0Signin = async () => {
    try {
      setError("");
      setAuth0Loading(true);
      await startAuth0Login("login");
    } catch (err: any) {
      setAuth0Loading(false);
      setError(err?.message || "Unable to start Auth0 login");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative isolate">
      <AuthNavbar buttonText="Sign up" buttonLink="/register" />
      <AuthBackground />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <AuthShowcase
            title="Run Projects Without Chaos"
            subtitle="Track priorities, sync teams, and move faster with one focused workflow from planning to delivery."
            highlights={[
              { label: "Focus Flow", value: "Plan, execute, finish", icon: "task_alt" },
              { label: "Personal Pace", value: "Work at your rhythm", icon: "psychology" },
              { label: "Clarity First", value: "One place for priorities", icon: "monitoring" },
            ]}
          />
          <div className="p-6 sm:p-8 lg:p-10">
          {/* Headline and Intro */}
          <div className="text-center mb-8">
            <h1 className="text-gray-900 tracking-tight text-[28px] font-bold leading-tight pb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 text-sm font-normal">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          )}

          {/* Error Message (login stage only) */}
          {error && !otpChallenge && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {otpChallenge ? (
            <>
              {otpInfo && showOtpInfo && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between gap-3">
                  <p className="text-amber-700 text-sm">{otpInfo}</p>
                  <button
                    type="button"
                    onClick={() => setShowOtpInfo(false)}
                    className="text-amber-700 hover:text-amber-800"
                    aria-label="Dismiss"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}
              <OtpVerification
                email={otpChallenge.email}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                loading={loading}
                error={error}
              />
            </>
          ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-gray-900 text-sm font-medium leading-normal">
                    Email Address
                  </label>
                  <input
                    className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-900 text-sm font-medium leading-normal">
                      Password
                    </label>
                    <Link
                      className="text-blue-600 text-xs font-semibold hover:underline"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative flex w-full items-stretch rounded-lg">
                    <input
                      className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                      placeholder="••••••••"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Primary Login Button */}
                <button
                  className="w-full mt-2 flex cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={loading || auth0Loading}
                >
                  {loading ? <RingLoader size="sm" className="text-white" /> : "Login"}
                </button>
          </form>
          )}

          {showAuth0 && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-semibold uppercase">
                  or
                </span>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleAuth0Signin}
                disabled={loading || auth0Loading}
                className="w-full h-12 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center"
              >
                {auth0Loading ? <RingLoader size="sm" /> : "Continue with Auth0"}
              </button>
            </>
          )}

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?
              <Link
                className="text-blue-600 font-semibold hover:underline ml-1"
                to="/register"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="p-6 text-center text-xs text-gray-500">
        © 2026 Task Tracker Inc. All rights reserved.
      </footer>
    </div>
  );
}
