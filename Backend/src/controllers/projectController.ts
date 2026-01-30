import { Request, Response } from 'express';
import Project from '../models/project';
import ProjectMember from '../models/ProjectMember';
import User from '../models/user';
import Task from '../models/task';
import { Op } from 'sequelize';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class ProjectController {
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

      const offset = (Number(page) - 1) * Number(limit);
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
            page: Number(page),
            limit: Number(limit),
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
        limit: Number(limit),
        offset,
        order: [['updated_at', 'DESC']]
      });

      // Calculate progress for each project
      const projectsWithProgress = await Promise.all(
        projects.map(async (project: any) => {
          const tasks = await Task.findAll({
            where: { project_id: project.id },
            attributes: ['status']
          });

          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((task: any) => task.status === 'Done').length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return {
            ...project.toJSON(),
            progress
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithProgress,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
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
      const isOwner = project.owner_id === userId;
      const isMember = await ProjectMember.findOne({
        where: {
          project_id: id,
          user_id: userId
        }
      });

      if (!isOwner && !isMember && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this project'
        });
      }

      // Get tasks separately
      const tasks = await Task.findAll({
        where: { project_id: id },
        attributes: ['status']
      });

      // Calculate progress
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.status === 'Done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        success: true,
        data: {
          ...project.toJSON(),
          progress
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
        memberIds = []
      } = req.body;

      console.log('Received project data:', { name, description, status, priority, startDate, endDate, memberIds });

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
      if (memberIds.length > 0) {
        const uniqueMemberIds = memberIds.filter((memberId: string) => memberId !== userId);
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
          progress: 0
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

      if (!member && req.user?.role !== 'admin') {
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
      if (project.owner_id !== userId && req.user?.role !== 'admin') {
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
}

export const projectController = new ProjectController();