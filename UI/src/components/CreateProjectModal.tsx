import React, { useRef, useState, useEffect } from "react";
import { CreateProjectRequest } from "../types/project";
import axios from "axios";

import { API_BASE_URL } from "../config/api";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState("#1387ec");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitees, setInvitees] = useState<Array<{ full_name: string; email: string }>>([]);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch users when search term changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm.trim()) {
        setAvailableUsers([]);
        return;
      }

      try {
        setLoadingUsers(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/projects/users`, {
          params: { search: searchTerm },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAvailableUsers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description should be at least 10 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const projectData: CreateProjectRequest = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      memberIds: selectedMembers.map((m) => m.id),
      invitees,
    };

    // Only add dates if they have values
    if (formData.startDate && formData.startDate.trim()) {
      projectData.startDate = formData.startDate;
    }
    if (formData.endDate && formData.endDate.trim()) {
      projectData.endDate = formData.endDate;
    }

    onSubmit(projectData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const projectColors = [
    "#1387ec", // Primary blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Amber
    "#8b5cf6", // Purple
    "#6b7280", // Gray
  ];

  const addMember = (member: User) => {
    if (!selectedMembers.find((m) => m.id === member.id)) {
      setSelectedMembers((prev) => [...prev, member]);
    }
    setSearchTerm("");
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const filteredMembers = availableUsers.filter(
    (member) => !selectedMembers.find((m) => m.id === member.id),
  );

  const addInvitee = () => {
    const full_name = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!full_name || !emailValid) return;

    const existsInSelected = selectedMembers.some(
      (member) => member.email.toLowerCase() === email,
    );
    const existsInInvitees = invitees.some((item) => item.email === email);
    if (existsInSelected || existsInInvitees) return;

    setInvitees((prev) => [...prev, { full_name, email }]);
    setInviteName("");
    setInviteEmail("");
  };

  const removeInvitee = (email: string) => {
    setInvitees((prev) => prev.filter((item) => item.email !== email));
  };

  const formatDescription = (
    mode: "bold" | "italic" | "bullet" | "numbered" | "quote",
  ) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.slice(start, end);
    const hasSelection = start !== end;

    const wrap = (prefix: string, suffix: string = "") => {
      const nextText =
        formData.description.slice(0, start) +
        (hasSelection ? `${prefix}${selectedText}${suffix}` : `${prefix}${suffix}`) +
        formData.description.slice(end);
      setFormData((prev) => ({ ...prev, description: nextText }));
      if (errors.description) {
        setErrors((prev) => ({ ...prev, description: "" }));
      }
    };

    if (mode === "bold") wrap("**", "**");
    if (mode === "italic") wrap("*", "*");
    if (mode === "bullet") wrap("- ");
    if (mode === "numbered") wrap("1. ");
    if (mode === "quote") wrap("> ");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[760px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        {/* Modal Header */}
        <div className="border-b border-slate-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-[#0d151b] text-2xl font-bold tracking-tight">
              Create New Project
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-display">
              Set up your workspace and invite your team.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Project Preview
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div
                  className="size-8 rounded-full border border-white shadow"
                  style={{ backgroundColor: selectedColor }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {formData.name.trim() || "Untitled Project"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedMembers.length} members selected • {invitees.length} invites
                  </p>
                </div>
              </div>
            </div>

            {/* Project Name */}
            <div className="flex flex-col gap-2">
              <label className="flex flex-col w-full">
                <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                  Project Name
                </p>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input flex w-full rounded-lg text-[#0d151b] focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border h-12 placeholder:text-[#4c759a] px-4 text-base font-normal ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-[#cfdce7] bg-white focus:border-blue-600"
                  }`}
                  placeholder="e.g., Q4 Marketing Campaign"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </label>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="flex flex-col w-full">
                <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                  Description
                </p>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => formatDescription("bold")}
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => formatDescription("italic")}
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => formatDescription("bullet")}
                  >
                    Bullet
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => formatDescription("numbered")}
                  >
                    Numbered
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => formatDescription("quote")}
                  >
                    Quote
                  </button>
                </div>
                <textarea
                  ref={descriptionRef}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={1000}
                  className={`form-input flex w-full min-w-0 flex-1 resize-none rounded-lg text-[#0d151b] focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border bg-white focus:border-blue-600 min-h-[120px] placeholder:text-[#4c759a] p-4 text-base font-normal leading-normal ${
                    errors.description ? "border-red-300 bg-red-50" : "border-[#cfdce7]"
                  }`}
                  placeholder="Describe goals, scope, success criteria, and key milestones..."
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Use simple markdown-style formatting with the buttons.
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {formData.description.length}/1000
                  </p>
                </div>
              </label>
            </div>

            {/* Start and End Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                    Start Date (Optional)
                  </p>
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input flex w-full rounded-lg text-[#0d151b] focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfdce7] bg-white focus:border-blue-600 h-12 px-4 text-base font-normal"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                    End Date (Optional)
                  </p>
                  <input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input flex w-full rounded-lg text-[#0d151b] focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfdce7] bg-white focus:border-blue-600 h-12 px-4 text-base font-normal"
                  />
                </label>
              </div>
            </div>

            {/* Project Category Color */}
            <div className="space-y-3">
              <h3 className="text-[#0d151b] text-sm font-semibold leading-tight tracking-tight">
                Project Category Color
              </h3>
              <div className="flex flex-wrap gap-4">
                {projectColors.map((color) => (
                  <label
                    key={color}
                    className={`size-8 rounded-full border cursor-pointer transition-all ${
                      selectedColor === color
                        ? "border-[3px] border-white ring ring-blue-600/40"
                        : "border border-[#cfdce7]"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="radio"
                      name="project-color"
                      value={color}
                      checked={selectedColor === color}
                      onChange={() => setSelectedColor(color)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="flex flex-col gap-2">
              <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                Add Team Members
              </p>
              <div className="relative group">
                <div className="flex items-center border border-[#cfdce7] bg-white rounded-lg h-12 px-4 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
                  <span className="material-symbols-outlined text-slate-400 mr-2">
                    search
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-[#4c759a] text-[#0d151b] outline-none"
                    placeholder="Search by name or email..."
                  />
                </div>

                {/* Search Dropdown */}
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="px-4 py-2 text-sm text-slate-500">
                        Searching...
                      </div>
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => addMember(member)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                        >
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {member.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {member.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-slate-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1.5 bg-blue-600/10 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold"
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {member.full_name.charAt(0)}
                          </div>
                        )}
                        <span>{member.full_name}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="material-symbols-outlined text-[14px] cursor-pointer hover:text-blue-600/70"
                        >
                          close
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                Invite New Member by Email
              </p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="h-11 rounded-lg border border-[#cfdce7] bg-white px-3 text-sm"
                  placeholder="Full name"
                />
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-11 rounded-lg border border-[#cfdce7] bg-white px-3 text-sm"
                  placeholder="Email address"
                />
                <button
                  type="button"
                  onClick={addInvitee}
                  className="h-11 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                >
                  Add Invite
                </button>
              </div>
              {invitees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {invitees.map((item) => (
                    <div
                      key={item.email}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold"
                    >
                      <span>{item.full_name}</span>
                      <span className="text-slate-500">{item.email}</span>
                      <button
                        type="button"
                        onClick={() => removeInvitee(item.email)}
                        className="material-symbols-outlined text-[14px]"
                      >
                        close
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 h-11 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            Create Project
            <span className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
