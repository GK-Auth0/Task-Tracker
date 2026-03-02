import React, { useState, useEffect } from "react";
import { projectService } from "../services/projectService";
import { Project, CreateProjectRequest } from "../types/project";
import CreateProjectModal from "../components/CreateProjectModal";
import ProjectsHeader from "../components/projects/ProjectsHeader";
import ProjectsFilters from "../components/projects/ProjectsFilters";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import ProjectsEmptyState from "../components/projects/ProjectsEmptyState";

type ProjectStatusFilter = "all" | Project["status"];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");
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
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      project.name.toLowerCase().includes(normalizedSearch) ||
      (project.description ?? "").toLowerCase().includes(normalizedSearch);
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
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-8">
        <ProjectsHeader onCreate={() => setShowCreateModal(true)} />

        <ProjectsFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
        />

        <ProjectsGrid
          projects={filteredProjects}
          onCreate={() => setShowCreateModal(true)}
        />

        {filteredProjects.length === 0 && <ProjectsEmptyState />}
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
