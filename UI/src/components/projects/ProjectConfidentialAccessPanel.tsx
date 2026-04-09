import React, { useMemo, useState } from "react";
import { ProjectConfidentialAccessConfig } from "../../types/project";

type AccessRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  decision_note?: string;
  requested_at?: string;
  requester?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
};

type ConfigUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

interface ProjectConfidentialAccessPanelProps {
  canViewConfidential: boolean;
  hasAdminAccess: boolean;
  requestStatus: "none" | "pending" | "approved" | "rejected";
  requestReason: string;
  submitting: boolean;
  onRequestReasonChange: (value: string) => void;
  onSubmitRequest: () => void;
  showReviewList: boolean;
  reviewItems: AccessRequest[];
  reviewing: string;
  onReview: (requestId: string, action: "approve" | "reject") => void;
  canManageConfig: boolean;
  config: ProjectConfidentialAccessConfig | null;
  configSaving: boolean;
  configError: string;
  configSearch: string;
  configSearchLoading: boolean;
  configUserOptions: ConfigUser[];
  onConfigSearchChange: (value: string) => void;
  onConfigScopeChange: (value: "specific_users" | "organization") => void;
  onToggleAllowedUser: (user: ConfigUser) => void;
  onRemoveAllowedUser: (userId: string) => void;
  onSaveConfig: () => void;
}

const ProjectConfidentialAccessPanel: React.FC<ProjectConfidentialAccessPanelProps> = ({
  canViewConfidential,
  hasAdminAccess,
  requestStatus,
  requestReason,
  submitting,
  onRequestReasonChange,
  onSubmitRequest,
  showReviewList,
  reviewItems,
  reviewing,
  onReview,
  canManageConfig,
  config,
  configSaving,
  configError,
  configSearch,
  configSearchLoading,
  configUserOptions,
  onConfigSearchChange,
  onConfigScopeChange,
  onToggleAllowedUser,
  onRemoveAllowedUser,
  onSaveConfig,
}) => {
  const [expanded, setExpanded] = useState(false);

  const requestStatusTone =
    requestStatus === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : requestStatus === "pending"
        ? "bg-amber-100 text-amber-700"
        : requestStatus === "rejected"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";

  const requestCount = reviewItems.filter((item) => item.status === "pending").length;
  const buttonLabel = useMemo(() => {
    if (expanded) return "Hide";
    if (canManageConfig) return "Manage";
    if (!canViewConfidential && requestStatus === "none") return "Request Access";
    return "View";
  }, [expanded, canManageConfig, canViewConfidential, requestStatus]);

  const selectedUsers = config?.allowed_users || [];
  const selectedUserIds = new Set(selectedUsers.map((user) => user.id));
  const configSummary =
    hasAdminAccess
      ? "Admin default access"
      : config?.access_scope === "organization"
      ? "Whole organization"
      : selectedUsers.length > 0
        ? `${selectedUsers.length} selected people`
        : "Restricted";

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Confidential Access
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-900">
            {canViewConfidential
              ? "Confidential details are visible"
              : "Some project details are restricted"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Permission: {configSummary}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${requestStatusTone}`}>
            {canViewConfidential ? "Access Granted" : `Request: ${requestStatus}`}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-sm">
              {expanded ? "expand_less" : "expand_more"}
            </span>
            {buttonLabel}
          </button>
        </div>
      </div>

      {!expanded && showReviewList && requestCount > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {requestCount} pending confidential access request{requestCount === 1 ? "" : "s"}
        </div>
      )}

      {!expanded && selectedUsers.length > 0 && config?.access_scope !== "organization" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedUsers.slice(0, 4).map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
            >
              {user.full_name}
            </span>
          ))}
          {selectedUsers.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              +{selectedUsers.length - 4} more
            </span>
          )}
        </div>
      )}

      {expanded && canManageConfig && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Admin Access Config</p>
              <p className="mt-1 text-xs text-slate-500">
                This is saved in the new `config` table and controls confidential
                access for this project.
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveConfig}
              disabled={configSaving}
              className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {configSaving ? "Saving..." : "Save Config"}
            </button>
          </div>

          {configError && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {configError}
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onConfigScopeChange("organization")}
              className={`rounded-xl border p-4 text-left ${
                config?.access_scope === "organization"
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">Whole organization</p>
              <p className="mt-1 text-xs text-slate-500">
                Every person in this workspace org can view confidential project details.
              </p>
            </button>
            <button
              type="button"
              onClick={() => onConfigScopeChange("specific_users")}
              className={`rounded-xl border p-4 text-left ${
                config?.access_scope !== "organization"
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">Specific people</p>
              <p className="mt-1 text-xs text-slate-500">
                Only selected users get confidential access automatically.
              </p>
            </button>
          </div>

          {config?.access_scope !== "organization" && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Add specific users
              </label>
              <input
                value={configSearch}
                onChange={(event) => onConfigSearchChange(event.target.value)}
                placeholder="Search users by name or email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUsers.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    No specific users selected yet.
                  </span>
                ) : (
                  selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {user.full_name}
                      <button
                        type="button"
                        onClick={() => onRemoveAllowedUser(user.id)}
                        className="text-slate-500 hover:text-rose-600"
                        aria-label={`Remove ${user.full_name}`}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="mt-4 space-y-2">
                {configSearchLoading ? (
                  <p className="text-xs text-slate-500">Searching users...</p>
                ) : configUserOptions.length === 0 && configSearch.trim() ? (
                  <p className="text-xs text-slate-500">No matching users found.</p>
                ) : (
                  configUserOptions.map((user) => {
                    const selected = selectedUserIds.has(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => onToggleAllowedUser(user)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                          selected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {selected ? "Selected" : user.role}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && !canManageConfig && !canViewConfidential && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Why do you need confidential details?
          </label>
          <textarea
            value={requestReason}
            onChange={(event) => onRequestReasonChange(event.target.value)}
            className="w-full min-h-[92px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            placeholder="Example: I need roadmap/files access to execute release planning for next sprint."
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Current status: {requestStatus}</p>
            <button
              type="button"
              onClick={onSubmitRequest}
              disabled={submitting || requestStatus === "pending"}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Request Access"}
            </button>
          </div>
        </div>
      )}

      {expanded && canViewConfidential && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Current Access</p>
          <p className="mt-1 text-xs text-slate-500">
            Sensitive tabs and project details are available for you right now.
          </p>
          {config?.access_scope === "organization" ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              This project is open to the whole organization.
            </div>
          ) : hasAdminAccess ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              You can access this project by default because you are a workspace admin.
            </div>
          ) : selectedUsers.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Allowed People
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {user.full_name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Access is available through your current role or approved request.
            </div>
          )}
        </div>
      )}

      {expanded && showReviewList && (
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800">
              Access Requests Review
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {reviewItems.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500">
                No access requests yet.
              </p>
            ) : (
              reviewItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex flex-wrap gap-3 items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.requester?.full_name || "Member"}
                    </p>
                    <p className="text-xs text-slate-500">{item.requester?.email || ""}</p>
                    {item.reason && (
                      <p className="mt-1 text-sm text-slate-700">{item.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">
                      {item.status}
                    </span>
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onReview(item.id, "approve")}
                          disabled={reviewing === item.id}
                          className="h-8 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReview(item.id, "reject")}
                          disabled={reviewing === item.id}
                          className="h-8 px-3 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectConfidentialAccessPanel;
