import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthNavbar from "../components/AuthNavbar";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <AuthNavbar buttonText="Sign up" buttonLink="/register" />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Headline and Intro */}
          <div className="text-center mb-8">
            <h1 className="text-gray-900 tracking-tight text-[28px] font-bold leading-tight pb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 text-sm font-normal">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
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
                <a
                  className="text-blue-600 text-xs font-semibold hover:underline"
                  href="#"
                >
                  Forgot password?
                </a>
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
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

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
      </main>

      {/* Simple Footer */}
      <footer className="p-6 text-center text-xs text-gray-500">
        © 2026 Task Tracker Inc. All rights reserved.
      </footer>
    </div>
  );
}
