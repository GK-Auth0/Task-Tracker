import { useState } from "react";
import { PullRequest, Commit } from "../../services/dashboard";

interface TaskPRsTabProps {
  pullRequests: PullRequest[];
  commits: Commit[];
  prLoading: boolean;
  onLinkPR: (prData: any) => void;
}

export default function TaskPRsTab({
  pullRequests,
  commits,
  prLoading,
  onLinkPR,
}: TaskPRsTabProps) {
  const [showLinkPRModal, setShowLinkPRModal] = useState(false);
  const [prForm, setPrForm] = useState({
    title: "",
    repository: "",
    branch: "",
    number: "",
    author: "",
    github_url: "",
    status: "open" as "open" | "merged" | "closed",
  });

  const handleLinkPR = async () => {
    if (!prForm.title || !prForm.repository || !prForm.number) return;

    try {
      await onLinkPR(prForm);
      setShowLinkPRModal(false);
      setPrForm({
        title: "",
        repository: "",
        branch: "",
        number: "",
        author: "",
        github_url: "",
        status: "open",
      });
    } catch (error) {
      console.error("Failed to link PR:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return { icon: "data_check", color: "text-green-500" };
      case "merged":
        return { icon: "merge", color: "text-purple-500" };
      case "closed":
        return { icon: "close", color: "text-red-500" };
      default:
        return { icon: "code", color: "text-slate-500" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-600";
      case "merged":
        return "bg-purple-100 text-purple-600";
      case "closed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (prLoading) {
    return (
      <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading PR data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-4">
        {/* Linked Pull Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Linked Pull Requests</h3>
            <button
              onClick={() => setShowLinkPRModal(true)}
              className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Link Pull Request
            </button>
          </div>
          {pullRequests.length > 0 ? (
            <div className="space-y-3">
              {pullRequests.map(pr => {
                const statusIcon = getStatusIcon(pr.status);
                const statusBadge = getStatusBadge(pr.status);

                return (
                  <div
                    key={pr.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-600/40 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`material-symbols-outlined ${statusIcon.color} text-lg`}>
                            {statusIcon.icon}
                          </span>
                          <h4 className="font-bold text-slate-900 truncate">{pr.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-medium text-slate-600">
                            {pr.repository} / {pr.branch}
                          </span>
                          <span>
                            #{pr.number} • {pr.status}{" "}
                            {new Date(pr.created_at).toLocaleDateString()} by {pr.author}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 ${statusBadge} text-[10px] font-bold rounded-full uppercase tracking-wider`}
                        >
                          {pr.status}
                        </span>
                        <a
                          className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline"
                          href={pr.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View in GitHub{" "}
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8">
              No pull requests linked to this task.
            </div>
          )}
        </div>

        {/* Related Commits */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Related Commits</h3>
          {commits.length > 0 ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Commit</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {commits.map(commit => (
                    <tr key={commit.id} className="hover:bg-white transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs font-mono text-blue-600 bg-blue-600/5 px-1.5 py-0.5 rounded">
                          {commit.hash.substring(0, 7)}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{commit.message}</td>
                      <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">
                        <div
                          className="size-5 rounded-full bg-slate-300 bg-cover"
                          style={{
                            backgroundImage: `url('${commit.author.avatar}')`,
                          }}
                        ></div>
                        <span>{commit.author.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {new Date(commit.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8">
              No commits found for this task.
            </div>
          )}
        </div>
      </div>

      {/* Link PR Modal */}
      {showLinkPRModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Link Pull Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={prForm.title}
                  onChange={e => setPrForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="PR title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repository</label>
                  <input
                    type="text"
                    value={prForm.repository}
                    onChange={e => setPrForm(prev => ({ ...prev, repository: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="repo-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={prForm.branch}
                    onChange={e => setPrForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="feature-branch"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PR Number</label>
                  <input
                    type="number"
                    value={prForm.number}
                    onChange={e => setPrForm(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={prForm.status}
                    onChange={e =>
                      setPrForm(prev => ({
                        ...prev,
                        status: e.target.value as "open" | "merged" | "closed",
                      }))
                    }
                    aria-label="Pull request status"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="open">Open</option>
                    <option value="merged">Merged</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  value={prForm.author}
                  onChange={e => setPrForm(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={prForm.github_url}
                  onChange={e => setPrForm(prev => ({ ...prev, github_url: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowLinkPRModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkPR}
                disabled={!prForm.title || !prForm.repository || !prForm.number}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Link PR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}