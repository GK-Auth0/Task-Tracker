import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import { authAPI } from "../services/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid reset link. Missing reset token.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword(token, newPassword);
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <AuthNavbar buttonText="Log in" buttonLink="/login" />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-gray-900 tracking-tight text-[28px] font-bold leading-tight pb-2">
              Reset Password
            </h1>
            <p className="text-gray-600 text-sm font-normal">
              Enter your new password below.
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
                New Password
              </label>
              <input
                className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                placeholder="Enter new password"
                required
                minLength={6}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-medium leading-normal">
                Confirm Password
              </label>
              <input
                className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                placeholder="Confirm new password"
                required
                minLength={6}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full mt-2 flex cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
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
      </main>
    </div>
  );
}
