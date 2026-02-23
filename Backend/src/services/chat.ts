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
  const memberGroups = await ChatGroupMember.findAll({
    where: { user_id: userId },
    include: [
      {
        model: ChatGroup,
        as: "group",
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
  });
  
  // Get member counts and format response
  const groupsWithCounts = await Promise.all(
    memberGroups.map(async (memberGroup) => {
      const group = memberGroup.group;
      if (!group) return null;
      const memberCount = await ChatGroupMember.count({
        where: { group_id: group.id },
      });
      
      return {
        ...group.toJSON(),
        memberCount,
      };
    }),
  );
  
  return (groupsWithCounts.filter(Boolean) as NonNullable<typeof groupsWithCounts[number]>[])
    .sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
};

export const getChatMessages = async (groupId: string, limit = 50) => {
  const messages = await ChatMessage.findAll({
    where: { group_id: groupId },
    include: [
      {
        model: User,
        as: "user",
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
  const message = await ChatMessage.create(data);
  
  // Fetch the message with user data
  const messageWithUser = await ChatMessage.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "full_name", "email"],
      },
    ],
  });
  
  return messageWithUser;
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
