import { Op } from "sequelize";
import { ProjectMember, User, UserInvitation } from "../models";
import { sendWorkspaceInviteEmail } from "./email";

export interface InviteeInput {
  full_name: string;
  email: string;
}

interface ProcessInvitesArgs {
  contextType: "project" | "task";
  projectId?: string;
  taskId?: string;
  invitedBy: string;
  invitees: InviteeInput[];
}

const normalizeInvitees = (invitees: InviteeInput[]): InviteeInput[] => {
  const seen = new Set<string>();
  const normalized: InviteeInput[] = [];

  for (const invitee of invitees) {
    const email = String(invitee.email || "").trim().toLowerCase();
    const full_name = String(invitee.full_name || "").trim();
    if (!email || !full_name || seen.has(email)) {
      continue;
    }
    seen.add(email);
    normalized.push({ email, full_name });
  }

  return normalized;
};

export const processInvites = async ({
  contextType,
  projectId,
  taskId,
  invitedBy,
  invitees,
}: ProcessInvitesArgs) => {
  const normalizedInvitees = normalizeInvitees(invitees);
  if (!normalizedInvitees.length) {
    return { invited: [], existingUsers: [] };
  }

  const emails = normalizedInvitees.map((item) => item.email);
  const existingUsers = await User.findAll({
    where: {
      email: {
        [Op.in]: emails,
      },
    },
    attributes: ["id", "first_name", "last_name", "email"],
  });

  const existingByEmail = new Map(
    existingUsers.map((user) => [
      String(user.email).toLowerCase(),
      user.get({ plain: true }) as {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
      },
    ]),
  );

  if (contextType === "project" && projectId) {
    const memberCreates: Promise<any>[] = [];
    for (const invitee of normalizedInvitees) {
      const existing = existingByEmail.get(invitee.email);
      if (!existing) continue;
      memberCreates.push(
        ProjectMember.findOrCreate({
          where: {
            project_id: projectId,
            user_id: existing.id,
          },
          defaults: {
            project_id: projectId,
            user_id: existing.id,
            role: "member",
          },
        }),
      );
    }
    if (memberCreates.length) {
      await Promise.all(memberCreates);
    }
  }

  const toInvite = normalizedInvitees.filter((item) => !existingByEmail.has(item.email));
  const invitationRecords: Array<Record<string, unknown>> = [];

  for (const invitee of toInvite) {
    const invitation = await UserInvitation.create({
      context_type: contextType,
      project_id: projectId,
      task_id: taskId,
      invited_by: invitedBy,
      full_name: invitee.full_name,
      email: invitee.email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    invitationRecords.push(invitation.get({ plain: true }) as Record<string, unknown>);

    sendWorkspaceInviteEmail({
      to: invitee.email,
      fullName: invitee.full_name,
      contextType,
      inviteToken: invitation.invite_token,
      projectId,
      taskId,
    }).catch((error) => {
      console.error("Failed to send invitation email:", error);
    });
  }

  return {
    invited: invitationRecords,
    existingUsers: normalizedInvitees
      .filter((item) => existingByEmail.has(item.email))
      .map((item) => existingByEmail.get(item.email)),
  };
};
