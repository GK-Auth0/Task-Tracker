import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import AuthBackground from "../components/auth/AuthBackground";
import AuthShowcase from "../components/auth/AuthShowcase";
import { authAPI } from "../services/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(
        response.message ||
          "OTP sent to your email if this account exists. Please check your inbox.",
      );

      const otpSessionId = response.data?.otpSessionId;
      if (otpSessionId) {
        setTimeout(() => {
          navigate(`/reset-password?otpSessionId=${encodeURIComponent(otpSessionId)}`);
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to request password reset",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative isolate">
      <AuthNavbar buttonText="Log in" buttonLink="/login" />
      <AuthBackground />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <AuthShowcase
            title="Recover Access Quickly"
            subtitle="Reset your password securely and get back to tracking your tasks without losing momentum."
            highlights={[
              { label: "Secure Flow", value: "Email verification based", icon: "verified_user" },
              { label: "Fast Recovery", value: "One link, quick reset", icon: "bolt" },
              { label: "Private", value: "No data exposed in UI", icon: "lock" },
            ]}
          />
          <div className="p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-8">
            <h1 className="text-gray-900 tracking-tight text-[28px] font-bold leading-tight pb-2">
              Forgot Password
            </h1>
            <p className="text-gray-600 text-sm font-normal">
              Enter your email and we will send a one-time OTP for password reset.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700 text-sm">{success}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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

            <button
              className="w-full mt-2 flex cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Back to
              <Link
                className="text-blue-600 font-semibold hover:underline ml-1"
                to="/login"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
