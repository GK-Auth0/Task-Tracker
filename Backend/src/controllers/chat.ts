import { Request, Response } from "express";
import { createChatGroup, getChatGroups, getChatMessages, createChatMessage } from "../services/chat";

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
    const { name, description } = req.body;
    
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
    });
    
    return res.status(201).json({
      success: true,
      data: group,
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
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Valid group ID is required",
      });
    }
    
    const messages = await getChatMessages(groupId, limit);
    
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
    
    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Valid group ID is required",
      });
    }
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }
    
    const message = await createChatMessage({
      group_id: groupId,
      user_id: userId,
      content,
      attachment_url,
      attachment_name,
    });
    
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