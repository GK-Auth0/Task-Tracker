import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import AuthBackground from "../components/auth/AuthBackground";
import RingLoader from "../components/RingLoader";
import { useAuth } from "../contexts/AuthContext";
import { organizationAPI } from "../services/organization";

export default function OrganizationOnboarding() {
  const navigate = useNavigate();
  const { user, logout, setOrganization } = useAuth();
  const [orgCode, setOrgCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinOrganization = async (event: FormEvent) => {
    event.preventDefault();
    setJoinLoading(true);
    setError("");

    try {
      const response = await organizationAPI.joinOrganizationByCode(
        orgCode.trim().toUpperCase(),
      );
      setOrganization(response.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to join organization");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateOrganization = async (event: FormEvent) => {
    event.preventDefault();
    setCreateLoading(true);
    setError("");

    try {
      const response = await organizationAPI.createOrganization({
        name: orgName.trim(),
      });
      setOrganization(response.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create organization");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative isolate">
      <AuthNavbar buttonText="Sign out" buttonLink="/login" />
      <AuthBackground />
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-2 sm:py-3">
        <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 text-white px-7 py-8">
            <div className="absolute -top-16 -right-12 size-40 rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-12 size-44 rounded-full bg-blue-400/20 blur-2xl" />
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                <span className="size-2 rounded-full bg-cyan-300 animate-pulse" />
                Workspace Access
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight">
                Join your team or create a new organization.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-blue-100/90 leading-6">
                Use your org code to get in fast, or create a workspace and start as the admin.
              </p>
            </div>

            <div className="relative z-10 grid gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-blue-100/80">
                    Join
                  </p>
                  <p className="text-sm font-bold">Use your org code</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <span className="material-symbols-outlined text-[18px]">domain_add</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-blue-100/80">
                    Create
                  </p>
                  <p className="text-sm font-bold">Become workspace admin</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="p-4 sm:p-5 lg:p-6">
            <div className="text-center mb-4">
              <h1 className="text-slate-900 text-[28px] font-bold mb-1">
                Complete your setup
              </h1>
              {user?.full_name && (
                <p className="text-slate-700 text-sm font-semibold">
                  {user.full_name}
                </p>
              )}
              <p className="mt-1 text-slate-500 text-sm">
                Join an existing organization or create a new one.
              </p>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"
              onSubmit={handleJoinOrganization}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Join with code
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Already have an invite?</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Enter the organization code shared by your admin.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Organization code</span>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(event) => setOrgCode(event.target.value.toUpperCase())}
                  placeholder="TT0001"
                  maxLength={6}
                  required
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 tracking-[0.25em] focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                />
              </label>
              <button
                type="submit"
                disabled={joinLoading || createLoading || !orgCode.trim()}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joinLoading ? (
                  <RingLoader size="sm" className="text-white" />
                ) : (
                  "Join organization"
                )}
              </button>
            </form>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"
              onSubmit={handleCreateOrganization}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Create new
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Set up your own workspace</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  We&apos;ll create the organization and link your account immediately.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Organization name</span>
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Acme Product Team"
                  minLength={2}
                  maxLength={255}
                  required
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                />
              </label>
              <button
                type="submit"
                disabled={createLoading || joinLoading || !orgName.trim()}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createLoading ? (
                  <RingLoader size="sm" className="text-white" />
                ) : (
                  "Create organization"
                )}
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <p>Need a different account?</p>
              <button
                type="button"
                onClick={logout}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
