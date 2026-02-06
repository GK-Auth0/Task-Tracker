import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { projectService } from "../services/projectService";
import { Project, CreateProjectRequest } from "../types/project";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: CreateProjectRequest) => {
    try {
      console.log("Creating project with data:", projectData);
      const response = await projectService.createProject(projectData);
      console.log("Project created successfully:", response);
      setShowCreateModal(false);
      fetchProjects();
    } catch (error: any) {
      console.error("Error creating project:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      // Show error to user
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to create project: ${errorMessage}`);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-gray-900 text-3xl font-black tracking-tight">
            Projects
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and track your ongoing team initiatives.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>New Project</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
            placeholder="Search projects by name or description..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "active"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "completed"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* Add New Card Skeleton */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 group"
        >
          <span className="material-symbols-outlined text-4xl">add_circle</span>
          <span className="text-sm font-bold">Create New Project</span>
        </button>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};

export default Projects;
