import { User, Task } from "../models";
import { Op } from "sequelize";

interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export async function getAllUsers(options: GetUsersOptions) {
  const { page, limit, search, role } = options;
  const offset = (page - 1) * limit;
  
  const whereClause: any = {};
  
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

export async function getUserById(userId: string) {
  const user = await User.findByPk(userId, {
    attributes: [
      "id",
      "full_name",
      "email",
      "role",
      "avatar_url",
      "created_at",
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

  return user.get({ plain: true });
}
