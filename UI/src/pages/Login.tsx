import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import AuthNavbar from "../components/AuthNavbar";

export default function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithRedirect({
        appState: {
          returnTo: "/dashboard"
        }
      });
    } catch (error) {
      console.error("Login failed:", error);
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
              Sign in to access your account
            </p>
          </div>

          {/* Auth0 Login Button */}
          <button
            className="w-full mt-2 flex cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors disabled:opacity-50"
            onClick={handleLogin}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? "Signing in..." : "Continue with Auth0"}
          </button>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?
              <a
                className="text-blue-600 font-semibold hover:underline ml-1 cursor-pointer"
                onClick={() => loginWithRedirect({ 
                  authorizationParams: { 
                    screen_hint: "signup"
                  },
                  appState: {
                    returnTo: "/dashboard"
                  }
                })}
              >
                Sign up
              </a>
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
