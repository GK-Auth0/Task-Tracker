import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/auth";
import AuthNavbar from "../components/AuthNavbar";
import AuthBackground from "../components/auth/AuthBackground";
import RingLoader from "../components/RingLoader";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePasswordForInvitedUser(email, newPassword);
      navigate("/login", { 
        state: { message: "Password changed successfully. Please login with your new password." }
      });
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative isolate">
      <AuthNavbar buttonText="Login" buttonLink="/login" />
      <AuthBackground />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-gray-900 tracking-tight text-[28px] font-bold leading-tight pb-2">
              Change Password
            </h1>
            <p className="text-gray-600 text-sm font-normal">
              You must change your password before continuing
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-medium leading-normal">
                New Password
              </label>
              <div className="relative flex w-full items-stretch rounded-lg">
                <input
                  className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-medium leading-normal">
                Confirm Password
              </label>
              <input
                className="flex w-full rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-sm font-normal"
                placeholder="••••••••"
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full mt-6 flex cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? <RingLoader size="sm" className="text-white" /> : "Change Password"}
            </button>
          </form>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-gray-500">
        © 2026 Task Tracker Inc. All rights reserved.
      </footer>
    </div>
  );
}