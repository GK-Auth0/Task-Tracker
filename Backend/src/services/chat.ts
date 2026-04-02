import ChatGroup from "../models/chatGroup";
import ChatMessage from "../models/chatMessage";
import ChatGroupMember from "../models/chatGroupMember";
import User from "../models/user";
import Project from "../models/project";
import { Op } from "sequelize";

const getUserOrganizationId = async (userId: string) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.organization_id || null;
};

export const createChatGroup = async (data: {
  name: string;
  description?: string;
  project_id?: string;
  created_by: string;
  is_project_group?: boolean;
  member_ids?: string[];
}) => {
  const group = await ChatGroup.create(data);

  const uniqueMemberIds = [...new Set([data.created_by, ...(data.member_ids || [])])];
  await Promise.all(
    uniqueMemberIds.map((memberId) =>
      ChatGroupMember.findOrCreate({
        where: {
          group_id: group.id,
          user_id: memberId,
        },
        defaults: {
          group_id: group.id,
          user_id: memberId,
        },
      }),
    ),
  );
  
  return group;
};

export const addUsersToChatGroup = async (groupId: string, userIds: string[]) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return;
  await Promise.all(
    uniqueIds.map((userId) =>
      ChatGroupMember.findOrCreate({
        where: { group_id: groupId, user_id: userId },
        defaults: { group_id: groupId, user_id: userId },
      }),
    ),
  );
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
          {
            model: ChatGroupMember,
            as: "members",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "full_name", "email"],
              },
            ],
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

      const groupJson: any = group.toJSON();
      const members = Array.isArray(groupJson.members) ? groupJson.members : [];
      let displayName = groupJson.name;
      const directKey = String(groupJson.description || "");
      const isDirect = directKey.startsWith("direct:");

      if (isDirect) {
        const otherMember = members.find((m: any) => m?.user?.id !== userId);
        if (otherMember?.user?.full_name) {
          displayName = otherMember.user.full_name;
        }
      }
      
      return {
        ...groupJson,
        name: displayName,
        is_direct: isDirect,
        members: members.map((m: any) => ({
          id: m?.user?.id,
          full_name: m?.user?.full_name,
          email: m?.user?.email,
        })),
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
  return getChatMessagesBefore(groupId, undefined, limit);
};

export const getChatMessagesBefore = async (
  groupId: string,
  before?: string,
  limit = 50,
) => {
  const whereClause: any = { group_id: groupId };
  if (before) {
    whereClause.created_at = { [Op.lt]: new Date(before) };
  }

  const messages = await ChatMessage.findAll({
    where: whereClause,
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
  await ChatGroup.update(
    { updated_at: new Date() },
    { where: { id: data.group_id } },
  );
  
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

export const searchChatUsers = async (
  userId: string,
  query: string,
  limit = 20,
) => {
  if (!query.trim()) return [];
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) return [];
  const rows = await User.findAll({
    where: {
      id: { [Op.ne]: userId },
      organization_id: organizationId,
      [Op.or]: [
        { full_name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
      ],
    },
    attributes: ["id", "full_name", "email", "avatar_url"],
    order: [["full_name", "ASC"]],
    limit,
  });
  return rows.map((row) => row.get({ plain: true }));
};

export const getOrCreateDirectGroup = async (userId: string, targetUserId: string) => {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("User must belong to an organization");
  }

  const ids = [userId, targetUserId].sort();
  const directKey = `direct:${ids[0]}:${ids[1]}`;

  let group = await ChatGroup.findOne({
    where: {
      description: directKey,
      is_project_group: false,
    },
  });

  if (!group) {
    const target = await User.findByPk(targetUserId, {
      attributes: ["id", "full_name", "organization_id"],
    });
    if (!target) {
      throw new Error("Target user not found");
    }
    if (target.organization_id !== organizationId) {
      throw new Error("Target user must belong to the same organization");
    }

    group = await ChatGroup.create({
      name: target.full_name,
      description: directKey,
      created_by: userId,
      is_project_group: false,
    });

    await ChatGroupMember.findOrCreate({
      where: { group_id: group.id, user_id: userId },
      defaults: { group_id: group.id, user_id: userId },
    });
    await ChatGroupMember.findOrCreate({
      where: { group_id: group.id, user_id: targetUserId },
      defaults: { group_id: group.id, user_id: targetUserId },
    });
  }

  return group.get({ plain: true });
};

export const createProjectGroup = async (projectId: string, createdBy: string, projectName: string) => {
  const groupName = `#${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  
  return await createChatGroup({
    name: groupName,
    description: `Project group for ${projectName}`,
    project_id: projectId,
    created_by: createdBy,
    is_project_group: true,
    member_ids: [createdBy],
  });
};
