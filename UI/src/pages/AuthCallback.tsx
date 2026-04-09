import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { exchangeAuth0CodeForAccessToken, isAuth0Visible } from "../config/auth0";

const getPostAuthPath = (onboardingRequired: boolean) =>
  onboardingRequired ? "/organization/onboarding" : "/dashboard";

export default function AuthCallback() {
  const { loginWithAuth0 } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeLogin = async () => {
      try {
        if (!isAuth0Visible()) {
          throw new Error("Auth0 sign-in is disabled.");
        }
        const { accessToken } = await exchangeAuth0CodeForAccessToken();
        const user = await loginWithAuth0(accessToken);
        navigate(getPostAuthPath(user.onboardingRequired), { replace: true });
      } catch (err: any) {
        setError(err?.message || "Failed to complete Auth0 login");
      } finally {
        setLoading(false);
      }
    };

    completeLogin();
  }, [loginWithAuth0, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Sign in failed</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="mx-auto size-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}
