import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import AuthNavbar from "../components/AuthNavbar";

export default function Register() {
  const { loginWithRedirect, isLoading } = useAuth0();
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: "signup"
        },
        appState: {
          returnTo: "/dashboard"
        }
      });
    } catch (error) {
      console.error("Signup failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-display transition-colors duration-300">
      <AuthNavbar buttonText="Log in" buttonLink="/login" />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[480px] bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
          <div className="p-8">
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 className="text-slate-900 text-3xl font-bold mb-2">
                Create your account
              </h1>
              <p className="text-slate-500 text-sm">
                Join thousands of professional teams today.
              </p>
            </div>

            {/* Auth0 Signup Button */}
            <button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
              onClick={handleSignup}
              disabled={loading || isLoading}
            >
              {loading || isLoading ? "Creating Account..." : "Continue with Auth0"}
            </button>

            {/* Footer Link */}
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-600 text-sm font-medium">
                Already have an account?{" "}
                <a
                  className="text-blue-600 hover:underline ml-1 cursor-pointer"
                  onClick={() => loginWithRedirect()}
                >
                  Log in
                </a>
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
