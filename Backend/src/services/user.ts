import { User, Task } from "../models";
import { Op } from "sequelize";
import type { GetUsersOptions } from "../types/user";

export async function getAllUsers(options: GetUsersOptions) {
  const { requesterId, page, limit, search, role } = options;
  const offset = (page - 1) * limit;

  const requester = await User.findByPk(requesterId, {
    attributes: ["id", "organization_id"],
  });

  if (!requester) {
    throw new Error("Requester not found");
  }

  if (!requester.organization_id) {
    return {
      users: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
  
  const whereClause: any = {};
  whereClause.organization_id = requester.organization_id;
  
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (role) {
    whereClause.role = role;
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    attributes: ["id", "full_name", "email", "role", "avatar_url"],
    where: whereClause,
    order: [["full_name", "ASC"]],
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);
  
  return {
    users: users.map((user) => user.get({ plain: true })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getUserById(userId: string, requesterId: string) {
  const requester = await User.findByPk(requesterId, {
    attributes: ["id", "organization_id"],
  });

  if (!requester) {
    throw new Error("Requester not found");
  }

  const user = await User.findByPk(userId, {
    attributes: [
      "id",
      "full_name",
      "email",
      "role",
      "avatar_url",
      "created_at",
      "organization_id",
    ],
    include: [
      {
        model: Task,
        as: "assigned_tasks",
        attributes: ["id", "title", "status", "priority", "due_date"],
        limit: 10,
        order: [["created_at", "DESC"]],
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (
    requester.organization_id !== user.organization_id &&
    requester.id !== user.id
  ) {
    throw new Error("Access denied");
  }

  return user.get({ plain: true });
}
