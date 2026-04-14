import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CreateProjectRequest } from "../types/project";
import aiChatAPI from "../services/aiChat";
import { buildProjectTemplate } from "../utils/descriptionTemplates";
import { ProjectStatus, ProjectPriority } from "../enums";
import { projectService } from "../services/projectService";
import { sprintsAPI } from "../services/sprints";
import { testCaseModulesAPI } from "../services/testCases";
import type { Sprint } from "../types/sprint";
import InviteCollaboratorDialog from "./InviteCollaboratorDialog";
import RichTextEditor from "./common/RichTextEditor";
import { plainTextToRichText, richTextToPlainText } from "../utils/richText";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (
    data: CreateProjectRequest,
    options?: {
      modules: string[];
      sprintSetup?:
        | { mode: "none" }
        | { mode: "create_new" }
        | {
            mode: "existing";
            sprintTemplate: {
              name: string;
              goal?: string | null;
              release?: string | null;
              squad?: string | null;
              owner_id?: string;
              capacity?: number | null;
              start_date?: string | null;
              end_date?: string | null;
              status: "Planning" | "Active" | "Completed";
            };
          };
    },
  ) => Promise<{ id: string; name: string } | null>;
}

type SprintOption = {
  id: string;
  name: string;
  goal?: string | null;
  release?: string | null;
  squad?: string | null;
  owner_id?: string;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "Planning" | "Active" | "Completed";
};

type ModuleOption = {
  id: string;
  name: string;
};

const sprintStatusPriority: Record<Sprint["status"], number> = {
  Active: 0,
  Planning: 1,
  Completed: 2,
};

const toSprintFamilyOptions = (sprints: Sprint[]): SprintOption[] => {
  const byName = new Map<string, Sprint>();

  sprints.forEach((sprint) => {
    const existing = byName.get(sprint.name);
    if (!existing) {
      byName.set(sprint.name, sprint);
      return;
    }

    const existingPriority = sprintStatusPriority[existing.status] ?? 99;
    const nextPriority = sprintStatusPriority[sprint.status] ?? 99;
    if (nextPriority < existingPriority) {
      byName.set(sprint.name, sprint);
      return;
    }

    if (nextPriority === existingPriority) {
      const existingUpdatedAt = new Date(existing.updated_at).getTime();
      const nextUpdatedAt = new Date(sprint.updated_at).getTime();
      if (nextUpdatedAt > existingUpdatedAt) {
        byName.set(sprint.name, sprint);
      }
    }
  });

  return Array.from(byName.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((sprint) => ({
      id: sprint.name,
      name: sprint.name,
      goal: sprint.goal,
      release: sprint.release,
      squad: sprint.squad,
      owner_id: sprint.owner_id,
      capacity: sprint.capacity,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status,
    }));
};

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const INVITE_SENDS_IMMEDIATELY = true;
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: "",
    description: "",
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState("#1387ec");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [invitees, setInvitees] = useState<Array<{ full_name: string; email: string }>>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [availableSprints, setAvailableSprints] = useState<SprintOption[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprintSetupMode, setSprintSetupMode] = useState<"none" | "existing" | "create_new">("none");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [moduleNameInput, setModuleNameInput] = useState("");
  const [moduleNames, setModuleNames] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<ModuleOption[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedExistingModule, setSelectedExistingModule] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const descriptionText = useMemo(
    () => richTextToPlainText(formData.description),
    [formData.description],
  );

  // Fetch users when search term changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm.trim()) {
        setAvailableUsers([]);
        return;
      }

      try {
        setLoadingUsers(true);
        const response = await projectService.getProjectUsers(searchTerm);
        setAvailableUsers(response.data || []);
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

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        setLoadingSprints(true);
        const response = await sprintsAPI.getSprints();
        if (response.success) {
          setAvailableSprints(toSprintFamilyOptions(response.data));
        }
      } catch (error) {
        console.error("Failed to fetch sprints:", error);
        setAvailableSprints([]);
      } finally {
        setLoadingSprints(false);
      }
    };

    fetchSprints();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        const response = await testCaseModulesAPI.getModules();
        if (response.success) {
          const unique = Array.from(
            response.data.reduce((map, module) => {
              const key = module.name.trim().toLowerCase();
              if (!key || map.has(key)) return map;
              map.set(key, {
                id: module.name,
                name: module.name.trim(),
              });
              return map;
            }, new Map<string, ModuleOption>()),
          )
            .map(([, value]) => value)
            .sort((left, right) => left.name.localeCompare(right.name));
          setAvailableModules(unique);
        }
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        setAvailableModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!descriptionText.trim()) {
      newErrors.description = "Description is required";
    } else if (descriptionText.trim().length < 10) {
      newErrors.description = "Description should be at least 10 characters";
    } else if (descriptionText.length > 2000) {
      newErrors.description = "Description should not exceed 2000 characters";
    }
    if (!moduleNames.length) {
      newErrors.modules = "At least one module is required";
    }
    if (sprintSetupMode === "existing" && !selectedSprintId) {
      newErrors.sprintSetup = "Select an existing sprint to mirror for this project";
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
    };
    if (!INVITE_SENDS_IMMEDIATELY) {
      projectData.invitees = invitees;
    }

    // Only add dates if they have values
    if (formData.startDate && formData.startDate.trim()) {
      projectData.startDate = formData.startDate;
    }
    if (formData.endDate && formData.endDate.trim()) {
      projectData.endDate = formData.endDate;
    }

    try {
      setSubmitting(true);
      const selectedSprint = availableSprints.find((item) => item.id === selectedSprintId);
      const sprintSetup =
        sprintSetupMode === "create_new"
          ? { mode: "create_new" as const }
          : sprintSetupMode === "existing" && selectedSprint
            ? {
                mode: "existing" as const,
                sprintTemplate: {
                  name: selectedSprint.name,
                  goal: selectedSprint.goal,
                  release: selectedSprint.release,
                  squad: selectedSprint.squad,
                  owner_id: selectedSprint.owner_id,
                  capacity: selectedSprint.capacity,
                  start_date: selectedSprint.start_date,
                  end_date: selectedSprint.end_date,
                  status: selectedSprint.status,
                },
              }
            : { mode: "none" as const };
      const createdProject = await onSubmit(projectData, {
        modules: moduleNames,
        sprintSetup,
      });
      if (sprintSetup.mode === "create_new" && createdProject?.id) {
        navigate(
          `/sprint-board?tab=create&projectId=${encodeURIComponent(createdProject.id)}`,
        );
      }
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
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

  const addModule = () => {
    const nextModule = moduleNameInput.trim();
    if (!nextModule) return;
    if (moduleNames.some((item) => item.toLowerCase() === nextModule.toLowerCase())) {
      setModuleNameInput("");
      return;
    }
    setModuleNames((prev) => [...prev, nextModule]);
    setModuleNameInput("");
    if (errors.modules) {
      setErrors((prev) => ({ ...prev, modules: "" }));
    }
  };

  const removeModule = (name: string) => {
    setModuleNames((prev) => prev.filter((item) => item !== name));
  };

  const addExistingModule = () => {
    const selected = selectedExistingModule.trim();
    if (!selected) return;
    if (moduleNames.some((item) => item.toLowerCase() === selected.toLowerCase())) {
      setSelectedExistingModule("");
      return;
    }
    setModuleNames((prev) => [...prev, selected]);
    setSelectedExistingModule("");
    if (errors.modules) {
      setErrors((prev) => ({ ...prev, modules: "" }));
    }
  };

  const filteredMembers = availableUsers.filter(
    (member) => !selectedMembers.find((m) => m.id === member.id),
  );

  const addInviteeFromDialog = (invitee: { full_name: string; email: string }) => {
    const existsInSelected = selectedMembers.some(
      (member) => member.email.toLowerCase() === invitee.email,
    );
    const existsInInvitees = invitees.some((item) => item.email === invitee.email);
    if (existsInSelected || existsInInvitees) return false;
    setInvitees((prev) => [...prev, invitee]);
    return true;
  };

  const removeInvitee = (email: string) => {
    setInvitees((prev) => prev.filter((item) => item.email !== email));
  };

  const handleSprintModeChange = (value: "none" | "existing" | "create_new") => {
    setSprintSetupMode(value);
    if (value !== "existing") {
      setSelectedSprintId("");
    }
    if (errors.sprintSetup) {
      setErrors((prev) => ({ ...prev, sprintSetup: "" }));
    }
  };

  const applyProjectTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      description: plainTextToRichText(buildProjectTemplate(prev.name)),
    }));
    setAiError("");
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
  };

  const generateProjectDescriptionWithAi = async () => {
    const name = formData.name.trim() || "Untitled Project";
    try {
      setAiLoading(true);
      setAiError("");
      const prompt = [
        "Generate a practical project description using this exact section order:",
        "Overview, Problem Statement, Goals, Success Metrics, Scope, Milestones, Stakeholders, Risks & Mitigation.",
        `Project name: ${name}.`,
        "Keep it concise, actionable, and in plain text with bullets.",
      ].join(" ");
      const response = await aiChatAPI.chat(prompt, "/projects/create", "balanced");
      const draft = String(response?.data?.reply || "").trim();
      if (!draft) {
        setAiError("AI did not return a draft.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        description: plainTextToRichText(draft.slice(0, 2000)),
      }));
      if (errors.description) {
        setErrors((prev) => ({ ...prev, description: "" }));
      }
    } catch (error) {
      setAiError("AI draft unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
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
          <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6">
            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}
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
              <div className="flex flex-col w-full">
                <p className="text-[#0d151b] text-sm font-semibold leading-normal pb-1">
                  Description
                </p>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                    onClick={applyProjectTemplate}
                    disabled={aiLoading}
                  >
                    Use Template
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-cyan-200 bg-cyan-50 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60"
                    onClick={generateProjectDescriptionWithAi}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Generating..." : "Generate Draft"}
                  </button>
                </div>
                <RichTextEditor
                  value={formData.description}
                  onChange={(nextValue) => {
                    setFormData((prev) => ({ ...prev, description: nextValue }));
                    if (errors.description) {
                      setErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  maxLength={2000}
                  error={errors.description}
                  helperText={
                    aiError || "Use headings, bold text, lists, highlighting, fonts, and links."
                  }
                  placeholder="Describe goals, scope, success criteria, and key milestones..."
                />
              </div>
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

            <div className="space-y-3">
              <h3 className="text-[#0d151b] text-sm font-semibold leading-tight tracking-tight">
                Project Modules
              </h3>

              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={moduleNameInput}
                    onChange={(e) => {
                      setModuleNameInput(e.target.value);
                      if (errors.modules) setErrors((prev) => ({ ...prev, modules: "" }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addModule(); }
                    }}
                    onFocus={() => setSelectedExistingModule("focused")}
                    onBlur={() => setTimeout(() => setSelectedExistingModule(""), 150)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm text-[#0d151b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                      errors.modules ? "border-red-300 bg-red-50" : "border-[#cfdce7] bg-white focus:border-blue-600"
                    }`}
                    placeholder="Type module name or pick from existing..."
                  />
                  {/* Suggestions dropdown - show on focus or when typing */}
                  {selectedExistingModule && (() => {
                    const filtered = availableModules.filter(
                      (m) =>
                        (!moduleNameInput.trim() || m.name.toLowerCase().includes(moduleNameInput.toLowerCase())) &&
                        !moduleNames.some((n) => n.toLowerCase() === m.name.toLowerCase())
                    );
                    return filtered.length > 0 ? (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        {filtered.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setModuleNameInput(m.name);
                            }}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                <button
                  type="button"
                  onClick={addModule}
                  className="h-10 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>

              {errors.modules && <p className="text-red-500 text-xs">{errors.modules}</p>}

              {moduleNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {moduleNames.map((moduleName) => (
                    <span
                      key={moduleName}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {moduleName}
                      <button
                        type="button"
                        onClick={() => removeModule(moduleName)}
                        className="material-symbols-outlined text-[13px] hover:text-blue-900"
                      >
                        close
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No modules added yet.</p>
              )}
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
              <div className="flex items-center justify-between">
                <p className="text-[#0d151b] text-sm font-semibold leading-normal">
                  Invite New Member by Email
                </p>
                <button
                  type="button"
                  onClick={() => setInviteDialogOpen(true)}
                  className="h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Invite
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

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-blue-900">Sprint Setup</p>
                <p className="mt-1 text-xs text-blue-800">
                  Choose an existing sprint to mirror for this new project, or send the user to sprint creation after save.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="sprint-setup-mode"
                    checked={sprintSetupMode === "none"}
                    onChange={() => handleSprintModeChange("none")}
                    className="mt-1 h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">No sprint yet</p>
                    <p className="text-xs text-slate-600">Create the project only.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="sprint-setup-mode"
                    checked={sprintSetupMode === "existing"}
                    onChange={() => handleSprintModeChange("existing")}
                    className="mt-1 h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Use existing sprint</p>
                    <p className="text-xs text-slate-600">
                      A matching sprint will be created for this project from the selected sprint.
                    </p>
                    <select
                      value={selectedSprintId}
                      onChange={(e) => {
                        setSelectedSprintId(e.target.value);
                        if (errors.sprintSetup) {
                          setErrors((prev) => ({ ...prev, sprintSetup: "" }));
                        }
                      }}
                      disabled={sprintSetupMode !== "existing" || loadingSprints}
                      className="mt-2 h-11 w-full rounded-lg border border-blue-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {loadingSprints ? "Loading sprints..." : "Select an existing sprint"}
                      </option>
                      {availableSprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                    {errors.sprintSetup ? (
                      <p className="mt-1 text-xs text-red-500">{errors.sprintSetup}</p>
                    ) : null}
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="sprint-setup-mode"
                    checked={sprintSetupMode === "create_new"}
                    onChange={() => handleSprintModeChange("create_new")}
                    className="mt-1 h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Create new sprint after save</p>
                    <p className="text-xs text-slate-600">
                      Redirect to the sprint create flow once the project is saved.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 h-11 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-project-form"
            disabled={submitting}
            className="px-8 h-11 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {submitting
              ? "Saving..."
              : sprintSetupMode === "create_new"
                ? "Save and Create Sprint"
                : sprintSetupMode === "existing"
                  ? "Create Project and Link Sprint"
                : "Create Project"}
            <span className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
    <InviteCollaboratorDialog
      open={inviteDialogOpen}
      onClose={() => setInviteDialogOpen(false)}
      onAddInvite={addInviteeFromDialog}
      title="Invite Team Member"
      sendInviteImmediately={INVITE_SENDS_IMMEDIATELY}
      showRoleSelector
    />
    </>
  );
};

export default CreateProjectModal;
