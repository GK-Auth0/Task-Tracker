import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../services/dashboard";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  avatar_url?: string;
}

export default function TeamManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await usersAPI.getUsers();
      if (response.success) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-blue-600/10 text-blue-600 border-blue-600/20";
      case "Member":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Viewer":
        return "bg-slate-50 text-slate-500 border-slate-100";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredMembers = members.filter((member) => {
    if (activeTab === "all") return true;
    if (activeTab === "admins") return member.role === "Admin";
    if (activeTab === "members") return member.role === "Member";
    if (activeTab === "viewers") return member.role === "Viewer";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8">
              {/* Page Heading */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest">
                    <button
                      onClick={() => navigate("/coming-soon")}
                      className="hover:text-blue-600 transition-colors"
                    >
                      Organization
                    </button>
                    <span className="material-symbols-outlined text-xs">
                      chevron_right
                    </span>
                    <span className="text-blue-600">Team Management</span>
                  </nav>
                  <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">
                    Team Management
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl">
                    Control access, assign roles, and manage invitations for
                    your entire workspace from one centralized dashboard.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                    onClick={() => navigate("/coming-soon")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      file_download
                    </span>
                    Export CSV
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    onClick={() => navigate("/coming-soon")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      person_add
                    </span>
                    Invite Member
                  </button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Total Members
                    </p>
                    <span className="material-symbols-outlined text-blue-600">
                      groups
                    </span>
                  </div>
                  <p className="text-slate-900 text-3xl font-bold">
                    {members.length}
                  </p>
                  <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">
                      trending_up
                    </span>
                    Active team
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Admins
                    </p>
                    <span className="material-symbols-outlined text-blue-600">
                      admin_panel_settings
                    </span>
                  </div>
                  <p className="text-slate-900 text-3xl font-bold">
                    {members.filter((m) => m.role === "Admin").length}
                  </p>
                  <p className="text-slate-500 text-xs font-medium">
                    Full access
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Members
                    </p>
                    <span className="material-symbols-outlined text-green-500">
                      person
                    </span>
                  </div>
                  <p className="text-slate-900 text-3xl font-bold">
                    {members.filter((m) => m.role === "Member").length}
                  </p>
                  <p className="text-slate-500 text-xs font-medium">
                    Standard access
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Viewers
                    </p>
                    <span className="material-symbols-outlined text-slate-400">
                      visibility
                    </span>
                  </div>
                  <p className="text-slate-900 text-3xl font-bold">
                    {members.filter((m) => m.role === "Viewer").length}
                  </p>
                  <p className="text-slate-500 text-xs font-medium">
                    Read-only access
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-col gap-0">
                <div className="flex border-b border-slate-200 px-2 overflow-x-auto whitespace-nowrap">
                  <button
                    className={`flex items-center gap-2 border-b-2 px-4 pb-4 pt-2 font-bold text-sm transition-all ${
                      activeTab === "all"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Members
                    <span className="bg-blue-600/10 px-2 py-0.5 rounded text-xs">
                      {members.length}
                    </span>
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-2 px-6 pb-4 pt-2 font-bold text-sm transition-all ${
                      activeTab === "admins"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab("admins")}
                  >
                    Admins
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {members.filter((m) => m.role === "Admin").length}
                    </span>
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-2 px-6 pb-4 pt-2 font-bold text-sm transition-all ${
                      activeTab === "members"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab("members")}
                  >
                    Members
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {members.filter((m) => m.role === "Member").length}
                    </span>
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-2 px-6 pb-4 pt-2 font-bold text-sm transition-all ${
                      activeTab === "viewers"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab("viewers")}
                  >
                    Viewers
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {members.filter((m) => m.role === "Viewer").length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-4 text-slate-900 text-sm font-semibold uppercase tracking-wider border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            Name
                            <button onClick={() => navigate("/coming-soon")}>
                              <span className="material-symbols-outlined text-sm cursor-pointer hover:text-blue-600">
                                arrow_drop_down
                              </span>
                            </button>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-slate-900 text-sm font-semibold uppercase tracking-wider border-b border-slate-200">
                          Email
                        </th>
                        <th className="px-6 py-4 text-slate-900 text-sm font-semibold uppercase tracking-wider border-b border-slate-200">
                          Role
                        </th>
                        <th className="px-6 py-4 text-slate-900 text-sm font-semibold uppercase tracking-wider border-b border-slate-200">
                          Status
                        </th>
                        <th className="px-6 py-4 text-slate-500 text-sm font-semibold uppercase tracking-wider border-b border-slate-200 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                {member.avatar_url ? (
                                  <img
                                    alt={member.full_name}
                                    className="h-full w-full object-cover"
                                    src={member.avatar_url}
                                  />
                                ) : (
                                  <span className="text-sm">
                                    {getInitials(member.full_name)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">
                                  {member.full_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Team Member
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {member.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleColor(member.role)}`}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-green-500"></span>
                              <span className="text-sm font-medium text-slate-900">
                                Active
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="text-slate-500 hover:text-blue-600 transition-colors"
                              onClick={() => navigate("/coming-soon")}
                            >
                              <span className="material-symbols-outlined">
                                more_horiz
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
      </div>
    </div>
  );
}
