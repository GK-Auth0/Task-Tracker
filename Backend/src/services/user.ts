import { User, Task } from "../models";

export async function getAllUsers() {
  const users = await User.findAll({
    attributes: ["id", "full_name", "email", "role", "avatar_url"],
    order: [["full_name", "ASC"]],
  });

  return users.map((user) => user.get({ plain: true }));
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
