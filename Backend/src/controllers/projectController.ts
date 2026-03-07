import { Request, Response } from 'express';
import Project from '../models/project';
import ProjectMember from '../models/ProjectMember';
import User from '../models/user';
import Task from '../models/task';
import ProjectConfidentialAccessRequest from '../models/projectConfidentialAccessRequest';
import { Op, fn, col, literal } from 'sequelize';
import { processInvites } from "../services/invitation";
import { addUsersToChatGroup, createProjectGroup } from "../services/chat";
import { parseBoundedInt } from "../helpers/query";
import { isWorkspaceAdmin } from "../middleware/rbac";
import { getAuditLogs } from "../services/auditService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

type AccessContext = {
  canViewConfidential: boolean;
  workspaceAdmin: boolean;
  isOwner: boolean;
  memberRole: string | null;
  latestRequest: ProjectConfidentialAccessRequest | null;
};

const isMissingTableError = (error: unknown) => {
  const code =
    (error as any)?.original?.code ||
    (error as any)?.parent?.code ||
    (error as any)?.code;
  return code === "42P01";
};

const isSchemaMismatchError = (error: unknown) => {
  const code =
    (error as any)?.original?.code ||
    (error as any)?.parent?.code ||
    (error as any)?.code;
  return code === "42P01" || code === "42703" || code === "42883";
};

export class ProjectController {
  constructor() {
    this.getProjects = this.getProjects.bind(this);
    this.getProject = this.getProject.bind(this);
    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.getProjectStats = this.getProjectStats.bind(this);
    this.getProjectRoadmap = this.getProjectRoadmap.bind(this);
    this.getProjectFiles = this.getProjectFiles.bind(this);
    this.uploadProjectFile = this.uploadProjectFile.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.addProjectMember = this.addProjectMember.bind(this);
    this.updateProjectMemberRole = this.updateProjectMemberRole.bind(this);
    this.removeProjectMember = this.removeProjectMember.bind(this);
    this.getProjectActivity = this.getProjectActivity.bind(this);
    this.requestConfidentialAccess = this.requestConfidentialAccess.bind(this);
    this.getConfidentialAccessRequests =
      this.getConfidentialAccessRequests.bind(this);
    this.reviewConfidentialAccessRequest =
      this.reviewConfidentialAccessRequest.bind(this);
  }

  private async getProjectAccessContext(
    project: Project,
    userId: string,
    workspaceRole?: string,
  ): Promise<AccessContext> {
    const workspaceAdmin = isWorkspaceAdmin(workspaceRole);
    const isOwner = project.owner_id === userId;

    const member = await ProjectMember.findOne({
      where: {
        project_id: project.id,
        user_id: userId,
      },
      attributes: ["role"],
    });

    const memberRole = member?.role || null;
    let latestRequest: ProjectConfidentialAccessRequest | null = null;
    try {
      latestRequest = await ProjectConfidentialAccessRequest.findOne({
        where: {
          project_id: project.id,
          requester_id: userId,
        },
        order: [["requested_at", "DESC"]],
      });
    } catch (error) {
      if (!isSchemaMismatchError(error)) {
        throw error;
      }
      // Feature table/schema not ready in DB; continue without request history.
      console.warn(
        "[project] Confidential access request lookup skipped due to schema mismatch:",
        (error as any)?.message || error,
      );
      latestRequest = null;
    }

    const hasApprovedRequest = latestRequest?.status === "approved";
    const canViewConfidential =
      workspaceAdmin ||
      isOwner ||
      memberRole === "owner" ||
      memberRole === "admin" ||
      hasApprovedRequest;

    return {
      canViewConfidential,
      workspaceAdmin,
      isOwner,
      memberRole,
      latestRequest,
    };
  }

  private async ensureProjectMemberOrOwner(projectId: string, userId: string) {
    const [ownedProject, member] = await Promise.all([
      Project.findOne({
        where: {
          id: projectId,
          owner_id: userId,
        },
        attributes: ["id"],
      }),
      ProjectMember.findOne({
        where: {
          project_id: projectId,
          user_id: userId,
        },
        attributes: ["id"],
      }),
    ]);

    return Boolean(ownedProject || member);
  }

  // Get all projects with pagination and filtering
  async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        priority,
        ownerId
      } = req.query;

      const safePage = parseBoundedInt(page, 1, 1, 100000);
      const safeLimit = parseBoundedInt(limit, 10, 1, 100);
      const offset = (safePage - 1) * safeLimit;
      const whereClause: any = {};
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get projects where user is owner or member
      const userProjectIds = await ProjectMember.findAll({
        where: { user_id: userId },
        attributes: ['project_id']
      });
      
      const memberProjectIds = userProjectIds.map(pm => pm.project_id);
      
      // Also include projects owned by the user
      const ownedProjects = await Project.findAll({
        where: { owner_id: userId },
        attributes: ['id']
      });
      
      const ownedProjectIds = ownedProjects.map(p => p.id);
      const allProjectIds = [...new Set([...memberProjectIds, ...ownedProjectIds])];
      
      if (allProjectIds.length > 0) {
        whereClause.id = { [Op.in]: allProjectIds };
      } else {
        // User has no projects, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0
          }
        });
      }

      // Add filters
      if (status) {
        whereClause.status = status;
      }
      if (priority) {
        whereClause.priority = priority;
      }
      if (ownerId) {
        whereClause.ownerId = ownerId;
      }
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'full_name', 'email', 'avatar_url']
          }
        ],
        limit: safeLimit,
        offset,
        order: [['updated_at', 'DESC']]
      });

      const projectIds = projects.map((project: any) => project.id);
      const taskStats =
        projectIds.length > 0
          ? await Task.findAll({
              where: { project_id: { [Op.in]: projectIds } },
              attributes: [
                "project_id",
                [fn("COUNT", col("id")), "total_tasks"],
                [
                  fn(
                    "SUM",
                    literal(`CASE WHEN status = 'Done' THEN 1 ELSE 0 END`),
                  ),
                  "completed_tasks",
                ],
              ],
              group: ["project_id"],
              raw: true,
            })
          : [];

      const taskStatsByProject = new Map<string, { total: number; completed: number }>();
      taskStats.forEach((row: any) => {
        taskStatsByProject.set(String(row.project_id), {
          total: Number(row.total_tasks || 0),
          completed: Number(row.completed_tasks || 0),
        });
      });

      const projectsWithProgress = projects.map((project: any) => {
        const stats = taskStatsByProject.get(project.id) || { total: 0, completed: 0 };
        const progress =
          stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return {
          ...project.toJSON(),
          progress,
        };
      });

      res.json({
        success: true,
        data: projectsWithProgress,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: count,
          totalPages: Math.ceil(count / safeLimit)
        }
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single project by ID
  async getProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const project = await Project.findByPk(id as string, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'full_name', 'email', 'avatar_url']
          },
          {
            model: ProjectMember,
            as: 'members',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'avatar_url']
              }
            ]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has access to this project (owner or member)
      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this project'
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );

      const [totalTasks, completedTasks] = await Promise.all([
        Task.count({ where: { project_id: id } }),
        Task.count({ where: { project_id: id, status: "Done" } }),
      ]);
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const plainProject = project.toJSON() as any;
      const memberCount = Array.isArray(plainProject.members) ? plainProject.members.length : 0;

      if (!accessContext.canViewConfidential) {
        plainProject.description = "Confidential project description. Request access to view.";
        plainProject.members = [];
      }

      res.json({
        success: true,
        data: {
          ...plainProject,
          progress,
          member_count: memberCount,
          confidential_access: {
            can_view: accessContext.canViewConfidential,
            role: accessContext.memberRole,
            request_status: accessContext.latestRequest?.status || "none",
            requested_at: accessContext.latestRequest?.requested_at || null,
            decision_note: accessContext.latestRequest?.decision_note || null,
          },
        }
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new project
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        name,
        description,
        status = 'planning',
        priority = 'medium',
        startDate,
        endDate,
        memberIds = [],
        invitees = [],
      } = req.body;
      const safeMemberIds = Array.isArray(memberIds) ? memberIds : [];

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Create project
      const project = await Project.create({
        name,
        description,
        status,
        priority,
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
        owner_id: userId
      });

      // Add owner as project member with owner role
      await ProjectMember.create({
        project_id: project.id,
        user_id: userId,
        role: 'owner'
      });

      // Add additional members if provided (excluding the owner)
      if (safeMemberIds.length > 0) {
        const uniqueMemberIds = safeMemberIds.filter((memberId: string) => memberId !== userId);
        if (uniqueMemberIds.length > 0) {
          const memberPromises = uniqueMemberIds.map((memberId: string) =>
            ProjectMember.create({
              project_id: project.id,
              user_id: memberId,
              role: 'member'
            })
          );
          await Promise.all(memberPromises);
        }
      }

      const inviteSummary = await processInvites({
        contextType: "project",
        projectId: project.id,
        invitedBy: userId,
        invitees: Array.isArray(invitees) ? invitees : [],
      });

      const projectGroup = await createProjectGroup(project.id, userId, name);
      const memberIdsForChat = [
        userId,
        ...safeMemberIds.filter((memberId: string) => memberId && memberId !== userId),
        ...((inviteSummary.existingUsers || [])
          .filter((entry: any) => entry && entry.id)
          .map((entry: any) => entry.id)),
      ];
      await addUsersToChatGroup(projectGroup.id, memberIdsForChat);

      // Fetch the created project with associations
      const createdProject = await Project.findByPk(project.id as string, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'full_name', 'email', 'avatar_url']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: {
          ...createdProject?.toJSON(),
          progress: 0,
          invite_summary: inviteSummary,
          chat_group_id: projectGroup.id,
        },
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update project
  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        status,
        priority,
        startDate,
        endDate
      } = req.body;

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has permission to update
      const userId = req.user?.id;
      const member = await ProjectMember.findOne({
        where: {
          project_id: id,
          user_id: userId,
          role: { [Op.in]: ['owner', 'admin'] }
        }
      });

      if (!member && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update project'
        });
      }

      // Update project
      await project.update({
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        status: status || project.status,
        priority: priority || project.priority,
        start_date: startDate ? new Date(startDate) : project.start_date,
        end_date: endDate ? new Date(endDate) : project.end_date
      });

      // Fetch updated project with associations
      const updatedProject = await Project.findByPk(id as string, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'full_name', 'email', 'avatar_url']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete project
  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has permission to delete
      const userId = req.user?.id;
      if (project.owner_id !== userId && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner or admin can delete project'
        });
      }

      // Delete associated records first
      await ProjectMember.destroy({ where: { project_id: id } });
      await Task.destroy({ where: { project_id: id } });
      
      // Delete project
      await project.destroy();

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get project statistics
  async getProjectStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const tasks = await Task.findAll({
        where: { project_id: id },
        attributes: ['status']
      });

      const totalTasks = tasks.length;
      const todoTasks = tasks.filter((task: any) => task.status === 'To Do').length;
      const inProgressTasks = tasks.filter((task: any) => task.status === 'In Progress').length;
      const completedTasks = tasks.filter((task: any) => task.status === 'Done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        success: true,
        data: {
          totalTasks,
          todoTasks,
          inProgressTasks,
          completedTasks,
          progress
        }
      });
    } catch (error) {
      console.error('Error fetching project stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get project roadmap data
  async getProjectRoadmap(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project",
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );
      if (!accessContext.canViewConfidential) {
        return res.status(403).json({
          success: false,
          message: "Roadmap is confidential. Request access from project owner.",
        });
      }
      
      const tasks = await Task.findAll({
        where: { project_id: id },
        attributes: ['id', 'title', 'status', 'start_date', 'due_date', 'created_at'],
        order: [['created_at', 'ASC']]
      });

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching project roadmap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project roadmap',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get project files
  async getProjectFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project",
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );
      if (!accessContext.canViewConfidential) {
        return res.status(403).json({
          success: false,
          message: "Files are confidential. Request access from project owner.",
        });
      }
      
      const { ProjectFile, User } = require('../models');
      
      const files = await ProjectFile.findAll({
        where: { project_id: id },
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'full_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      console.error('Error fetching project files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project files',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Upload project file
  async uploadProjectFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;
      const userId = req.user?.id;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project",
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );
      if (!accessContext.canViewConfidential) {
        return res.status(403).json({
          success: false,
          message: "File uploads are restricted. Request confidential access.",
        });
      }

      // Upload to Cloudinary
      const cloudinary = require('../config/cloudinary').default;
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `task-tracker/projects/${id}`,
        resource_type: 'auto'
      });

      // Save file metadata to database
      const { ProjectFile, User } = require('../models');
      const projectFile = await ProjectFile.create({
        project_id: id,
        filename: result.public_id,
        original_name: file.originalname,
        file_url: result.secure_url,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: userId
      });

      // Fetch the created file with uploader info
      const fileWithUploader = await ProjectFile.findByPk(projectFile.id, {
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: fileWithUploader,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading project file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload project file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get users for team member selection
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { search } = req.query;
      const whereClause: any = {};

      if (search) {
        whereClause[Op.or] = [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ['id', 'full_name', 'email', 'role', 'avatar_url'],
        order: [['full_name', 'ASC']],
        limit: 50
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addProjectMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role = "member" } = req.body;
      const actorId = req.user?.id;

      if (!actorId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const managerMembership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: actorId,
          role: { [Op.in]: ["owner", "admin"] },
        },
      });

      if (!managerMembership && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Only project owner/admin can add members",
        });
      }

      const user = await User.findByPk(String(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existingMembership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: String(userId),
        },
      });

      if (existingMembership) {
        return res.status(200).json({
          success: true,
          message: "User is already a project member",
          data: existingMembership,
        });
      }

      const normalizedRole =
        ["owner", "admin", "member", "viewer"].includes(String(role))
          ? String(role)
          : "member";

      const created = await ProjectMember.create({
        project_id: id as string,
        user_id: String(userId),
        role: normalizedRole as "owner" | "admin" | "member" | "viewer",
      });

      return res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: created,
      });
    } catch (error) {
      console.error("Error adding project member:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add project member",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateProjectMemberRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const role = String(req.body?.role || "").trim().toLowerCase();
      const actorId = req.user?.id;

      if (!actorId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!["owner", "admin", "member", "viewer"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "role must be one of: owner, admin, member, viewer",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const managerMembership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: actorId,
          role: { [Op.in]: ["owner", "admin"] },
        },
      });

      if (!managerMembership && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Only project owner/admin can update member role",
        });
      }

      const membership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: String(userId),
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "Project member not found",
        });
      }

      if (membership.role === "owner" && role !== "owner") {
        return res.status(400).json({
          success: false,
          message: "Project owner role cannot be changed",
        });
      }

      membership.role = role as "owner" | "admin" | "member" | "viewer";
      await membership.save();

      return res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        data: membership,
      });
    } catch (error) {
      console.error("Error updating project member role:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update project member role",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async removeProjectMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const actorId = req.user?.id;

      if (!actorId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const managerMembership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: actorId,
          role: { [Op.in]: ["owner", "admin"] },
        },
      });

      if (!managerMembership && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Only project owner/admin can remove members",
        });
      }

      const membership = await ProjectMember.findOne({
        where: {
          project_id: id as string,
          user_id: String(userId),
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "Project member not found",
        });
      }

      if (membership.role === "owner") {
        return res.status(400).json({
          success: false,
          message: "Project owner cannot be removed",
        });
      }

      await membership.destroy();
      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Error removing project member:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove project member",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getProjectActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const limit = parseBoundedInt(req.query.limit, 50, 1, 200);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project",
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );

      if (!accessContext.canViewConfidential) {
        return res.status(403).json({
          success: false,
          message: "Activity logs are confidential. Request access from owner/admin.",
        });
      }

      const logs = await getAuditLogs("project", id as string, limit);
      return res.status(200).json({
        success: true,
        message: "Project activity logs retrieved successfully",
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching project activity:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch project activity",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async requestConfidentialAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const reason = String(req.body?.reason || "").trim();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const hasAccess = await this.ensureProjectMemberOrOwner(id as string, userId);
      if (!hasAccess && !isWorkspaceAdmin(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project",
        });
      }

      const accessContext = await this.getProjectAccessContext(
        project,
        userId,
        req.user?.role,
      );
      if (accessContext.canViewConfidential) {
        return res.status(200).json({
          success: true,
          message: "You already have confidential access",
          data: { status: "approved" },
        });
      }

      const pending = await ProjectConfidentialAccessRequest.findOne({
        where: {
          project_id: id as string,
          requester_id: userId,
          status: "pending",
        },
      });
      if (pending) {
        return res.status(200).json({
          success: true,
          message: "Confidential access request already pending",
          data: pending,
        });
      }

      const created = await ProjectConfidentialAccessRequest.create({
        project_id: id as string,
        requester_id: userId,
        status: "pending",
        reason: reason || undefined,
        requested_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Confidential access request submitted",
        data: created,
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({
          success: false,
          message:
            "Confidential access workflow is not initialized. Apply DB migration V1022.",
        });
      }
      console.error("Error requesting confidential access:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to request confidential access",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getConfidentialAccessRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const canReview = project.owner_id === userId || isWorkspaceAdmin(req.user?.role);
      if (!canReview) {
        return res.status(403).json({
          success: false,
          message: "Only project owner/admin can review requests",
        });
      }

      const requests = await ProjectConfidentialAccessRequest.findAll({
        where: {
          project_id: id as string,
        },
        include: [
          {
            model: User,
            as: "requester",
            attributes: ["id", "full_name", "email", "role"],
          },
        ],
        order: [["requested_at", "DESC"]],
        limit: 50,
      });

      return res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Confidential access workflow is not initialized yet.",
        });
      }
      console.error("Error fetching confidential access requests:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch confidential access requests",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async reviewConfidentialAccessRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, requestId } = req.params;
      const userId = req.user?.id;
      const action = String(req.body?.action || "").toLowerCase();
      const decisionNote = String(req.body?.decision_note || "").trim();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({
          success: false,
          message: "action must be approve or reject",
        });
      }

      const project = await Project.findByPk(id as string);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const canReview = project.owner_id === userId || isWorkspaceAdmin(req.user?.role);
      if (!canReview) {
        return res.status(403).json({
          success: false,
          message: "Only project owner/admin can review requests",
        });
      }

      const request = await ProjectConfidentialAccessRequest.findOne({
        where: {
          id: requestId as string,
          project_id: id as string,
          status: "pending",
        },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Pending request not found",
        });
      }

      request.status = action === "approve" ? "approved" : "rejected";
      request.decided_by = userId;
      request.decided_at = new Date();
      request.decision_note = decisionNote || undefined;
      await request.save();

      return res.status(200).json({
        success: true,
        message: `Request ${action}d successfully`,
        data: request,
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({
          success: false,
          message:
            "Confidential access workflow is not initialized. Apply DB migration V1022.",
        });
      }
      console.error("Error reviewing confidential access request:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to review confidential access request",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export const projectController = new ProjectController();
