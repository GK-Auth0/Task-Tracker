import ChatGroup from "../models/chatGroup";
import ChatMessage from "../models/chatMessage";
import ChatGroupMember from "../models/chatGroupMember";
import User from "../models/user";
import Project from "../models/project";

export const createChatGroup = async (data: {
  name: string;
  description?: string;
  project_id?: string;
  created_by: string;
  is_project_group?: boolean;
}) => {
  const group = await ChatGroup.create(data);
  
  // Add creator as member
  await ChatGroupMember.create({
    group_id: group.id,
    user_id: data.created_by,
  });
  
  return group;
};

export const getChatGroups = async (userId: string) => {
  const groups = await ChatGroup.findAll({
    include: [
      {
        model: ChatGroupMember,
        where: { user_id: userId },
        attributes: [],
      },
      {
        model: Project,
        attributes: ["id", "name"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
  
  // Get member counts
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const memberCount = await ChatGroupMember.count({
        where: { group_id: group.id },
      });
      
      return {
        ...group.toJSON(),
        memberCount,
      };
    })
  );
  
  return groupsWithCounts;
};

export const getChatMessages = async (groupId: string, limit = 50) => {
  const messages = await ChatMessage.findAll({
    where: { group_id: groupId },
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
  });
  
  return messages.reverse();
};

export const createChatMessage = async (data: {
  group_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
}) => {
  return await ChatMessage.create(data);
};

export const createProjectGroup = async (projectId: string, createdBy: string, projectName: string) => {
  const groupName = `#${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  
  return await createChatGroup({
    name: groupName,
    description: `Project group for ${projectName}`,
    project_id: projectId,
    created_by: createdBy,
    is_project_group: true,
  });
};