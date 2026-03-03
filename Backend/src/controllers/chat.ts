import { Request, Response } from "express";
import fs from "fs/promises";
import {
  createChatGroup,
  getChatGroups,
  getChatMessagesBefore,
  createChatMessage,
  searchChatUsers,
  getOrCreateDirectGroup,
  addUsersToChatGroup,
} from "../services/chat";
import ChatGroupMember from "../models/chatGroupMember";
import { broadcastChatMessage } from "../realtime/chatSocket";
import cloudinary from "../config/cloudinary";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }
    
    const groups = await getChatGroups(userId);
    
    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat groups",
      error: (error as any).message,
    });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, description, member_ids = [] } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }
    
    const group = await createChatGroup({
      name,
      description,
      created_by: userId,
      member_ids: Array.isArray(member_ids) ? member_ids : [],
    });

    await addUsersToChatGroup(group.id, Array.isArray(member_ids) ? member_ids : []);

    const groups = await getChatGroups(userId);
    const created = groups.find((g: any) => g.id === group.id) || group;
    
    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create chat group",
      error: (error as any).message,
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before =
      typeof req.query.before === "string" ? req.query.before : undefined;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }

    if (!groupId || typeof groupId !== "string" || !isUuid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Valid group ID is required",
      });
    }

    const membershipCount = await ChatGroupMember.count({
      where: { group_id: groupId, user_id: userId },
    });
    if (membershipCount === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat group",
      });
    }

    const messages = await getChatMessagesBefore(groupId, before, limit);

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: (error as any).message,
    });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const query = String(req.query.q || "");
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }

    const users = await searchChatUsers(userId, query, limit);
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: (error as any).message,
    });
  }
};

export const createOrOpenDirect = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const targetUserId = req.params.userId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }

    if (!targetUserId || !isUuid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Valid target user ID is required",
      });
    }

    const group = await getOrCreateDirectGroup(userId, targetUserId);
    const groups = await getChatGroups(userId);
    const fullGroup = groups.find((g: any) => g.id === (group as any).id) || group;
    return res.status(200).json({
      success: true,
      data: fullGroup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to open direct chat",
      error: (error as any).message,
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { groupId } = req.params;
    const { content, attachment_url, attachment_name } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }

    if (!groupId || typeof groupId !== "string" || !isUuid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Valid group ID is required",
      });
    }

    const membershipCount = await ChatGroupMember.count({
      where: { group_id: groupId, user_id: userId },
    });
    if (membershipCount === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat group",
      });
    }

    if (!content && !attachment_url) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachment is required",
      });
    }

    const safeContent = content?.trim() || attachment_name || "Attachment";
    
    const message = await createChatMessage({
      group_id: groupId,
      user_id: userId,
      content: safeContent,
      attachment_url,
      attachment_name,
    });

    if (message) {
      broadcastChatMessage(groupId, (message as any).toJSON ? (message as any).toJSON() : message);
    }
    
    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: (error as any).message,
    });
  }
};

export const uploadAttachment = async (req: Request, res: Response) => {
  const file = (req as any).file;
  try {
    const userId = (req as any).user?.id;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
      });
    }

    if (!groupId || typeof groupId !== "string" || !isUuid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Valid group ID is required",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    const membershipCount = await ChatGroupMember.count({
      where: { group_id: groupId, user_id: userId },
    });
    if (membershipCount === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat group",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: `task-tracker/chat/${groupId}`,
      resource_type: "auto",
    });

    return res.status(200).json({
      success: true,
      data: {
        attachment_url: uploadResult.secure_url,
        attachment_name: file.originalname,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload attachment",
      error: (error as any).message,
    });
  } finally {
    if (file?.path) {
      await fs.unlink(file.path).catch(() => undefined);
    }
  }
};
