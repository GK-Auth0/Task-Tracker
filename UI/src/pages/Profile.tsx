import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { authAPI } from "../services/auth";

import { API_BASE_URL } from "../config/api";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const organization = user?.organization;
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    projectsLead: 0,
    teamContributions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [updating, setUpdating] = useState(false);

  const [resetStep, setResetStep] = useState<"idle" | "otpSent" | "done">("idle");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const tasksResponse = await taskService.getTasks({
        assigneeId: user.id,
        status: "Done",
      });

      const projectsResponse = await projectService.getProjects();

      const allTasksResponse = await taskService.getTasks({
        assigneeId: user.id,
      });

      setStats({
        tasksCompleted: tasksResponse.success ? tasksResponse.data.length : 0,
        projectsLead: projectsResponse.data.filter((p) => p.ownerId === user.id)
          .length,
        teamContributions: allTasksResponse.success
          ? allTasksResponse.data.length
          : 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setNewName(user?.full_name || "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || !user?.id) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ full_name: newName.trim() }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setUpdating(false);
      setEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName("");
  };

  const sendResetOtp = async () => {
    if (!user?.email) return;

    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const response = await authAPI.forgotPassword(user.email);
      const sessionId = response.data?.otpSessionId;
      setOtpSessionId(sessionId || "");
      setResetStep("otpSent");
      setResetSuccess(
        "An OTP has been sent to your email. Enter it below with a new password.",
      );
    } catch (err: any) {
      setResetError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to send reset OTP. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (resetStep === "otpSent" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [resetStep]);

  const handleResetSubmit = async () => {
    setResetError("");
    setResetSuccess("");

    if (!otpSessionId) {
      setResetError("OTP session missing. Request a new reset OTP.");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setResetError("Enter a valid 6-digit OTP.");
      return;
    }

    if (newPasswordValue.length < 6) {
      setResetError("New password must be at least 6 characters.");
      return;
    }

    if (newPasswordValue !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await authAPI.resetPassword(otpSessionId, otp, newPasswordValue);
      setResetSuccess("Password has been reset successfully. Please log in again.");
      setResetStep("done");
      setOtp("");
      setNewPasswordValue("");
      setConfirmPassword("");
    } catch (err: any) {
      setResetError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password",
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-[1680px] mx-auto min-h-screen overflow-auto flex flex-col gap-8 px-4 py-6 sm:px-6 xl:px-10 xl:py-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <main className="min-w-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900">User Summary</h1>
            <p className="text-slate-500 text-sm mt-1">
              Review your personal details and account status.
            </p>
          </div>
          <div className="p-8 space-y-10">
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">
                Profile Photo
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="size-24 rounded-full border-4 border-slate-100 bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0) || "U"}
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {user?.full_name || "Unknown User"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Member since{" "}
                    {new Date(Date.now()).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-y-8 gap-x-10">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                    Full Name
                  </span>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <label htmlFor="profile-full-name" className="sr-only">
                        Full name
                      </label>
                      <input
                        id="profile-full-name"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-base font-medium text-slate-900 border border-slate-300 rounded px-2 py-1 flex-1"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveName()
                        }
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={updating || !newName.trim()}
                        className="text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">
                          check
                        </span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-lg">
                          close
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-base font-medium text-slate-900">
                        {user?.full_name || "Not provided"}
                      </span>
                      <button
                        onClick={handleEditName}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                    Email Address
                  </span>
                  <span className="text-base font-medium text-slate-900">
                    {user?.email || "Not provided"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                    Role
                  </span>
                  <span className="text-base font-medium text-slate-900 capitalize">
                    {user?.role || "Member"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                    Status
                  </span>
                  <span className="text-base font-medium text-emerald-600">
                    Active
                  </span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Organization Details
                </h3>
                {organization?.status && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {organization.status}
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-y-6 gap-x-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                      Organization Name
                    </span>
                    <span className="text-base font-medium text-slate-900">
                      {organization?.name || "Not linked yet"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                      Organization Code
                    </span>
                    <span className="text-base font-medium text-slate-900">
                      {organization?.org_code || "Pending"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                      Workspace Slug
                    </span>
                    <span className="text-base font-medium text-slate-900">
                      {organization?.slug || "Pending"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                      Access State
                    </span>
                    <span className="text-base font-medium text-slate-900">
                      {organization ? "Organization linked" : "Awaiting organization setup"}
                    </span>
                  </div>
                </div>
                {!organization && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This account is not linked to an organization yet. Complete onboarding with your
                    personal invite code to finish workspace setup.
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">
                Change Password (OTP)
              </h3>
              <div className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{resetError}</p>
                  </div>
                )}
                {resetSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-700 text-sm">{resetSuccess}</p>
                  </div>
                )}

                {resetStep === "idle" && (
                  <button
                    type="button"
                    onClick={sendResetOtp}
                    disabled={resetLoading || !user?.email}
                    className="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {resetLoading ? "Sending OTP..." : "Send Password Reset OTP"}
                  </button>
                )}

                {resetStep === "otpSent" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="profile-reset-otp" className="sr-only">
                          OTP code
                        </label>
                        <input
                          id="profile-reset-otp"
                          ref={otpInputRef}
                          value={otp}
                          onChange={(e) =>
                            setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                          }
                          placeholder="Enter OTP"
                          className="w-full h-12 rounded-lg border border-slate-300 px-4"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label htmlFor="profile-new-password" className="sr-only">
                          New password
                        </label>
                        <input
                          id="profile-new-password"
                          value={newPasswordValue}
                          onChange={(e) => setNewPasswordValue(e.target.value)}
                          placeholder="New password"
                          type="password"
                          className="w-full h-12 rounded-lg border border-slate-300 px-4"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="profile-confirm-password" className="sr-only">
                        Confirm new password
                      </label>
                      <input
                        id="profile-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        type="password"
                        className="w-full h-12 rounded-lg border border-slate-300 px-4"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetSubmit}
                        disabled={resetLoading}
                        className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {resetLoading ? "Updating..." : "Reset Password"}
                      </button>
                      <button
                        type="button"
                        onClick={sendResetOtp}
                        disabled={resetLoading}
                        className="flex-1 h-12 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {resetStep === "done" && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep("idle");
                      setResetSuccess("");
                    }}
                    className="w-full h-12 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Reset another password
                  </button>
                )}
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
                <span>
                  This profile is verified and managed by the organization.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-full shrink-0 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Stats</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tasks Completed</p>
                <p className="text-xl font-bold text-slate-900">
                  {loading ? "..." : stats.tasksCompleted}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined">star</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Projects Lead</p>
                <p className="text-xl font-bold text-slate-900">
                  {loading ? "..." : stats.projectsLead}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Team Contributions</p>
                <p className="text-xl font-bold text-slate-900">
                  {loading ? "..." : stats.teamContributions}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Profile Completion
              </span>
              <span className="text-sm font-bold text-blue-600">100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Organization Snapshot</h3>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Organization
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {organization?.name || "No organization linked"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Code
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {organization?.org_code || "Pending"}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {organization?.status || "Setup pending"}
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              {organization
                ? "Your workspace access is active and connected to your current organization."
                : "Link an organization during onboarding to unlock your full workspace access."}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <h4 className="font-bold mb-2">Enterprise Plan</h4>
          <p className="text-blue-100 text-sm mb-4">
            You have full access to advanced reporting and unlimited team
            members.
          </p>
          <button className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors">
            View Details
          </button>
        </div>
      </aside>
      </div>
    </div>
  );
};

export default Profile;
