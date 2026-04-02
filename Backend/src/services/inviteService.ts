import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User, Invite, Organization } from '../models';
import { sendWelcomeEmail } from './email';

const generateInviteCode = (): string => {
  return randomBytes(16).toString('hex');
};

const generateOrgAccessCode = (): string => {
  return randomBytes(4).toString('hex').toUpperCase();
};

const createUniqueOrgAccessCode = async (): Promise<string> => {
  while (true) {
    const candidate = generateOrgAccessCode();
    const existingInvite = await Invite.findOne({
      where: { org_code: candidate },
      attributes: ['id'],
    });

    if (!existingInvite) {
      return candidate;
    }
  }
};

const generateTemporaryPassword = (): string => {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const createInvite = async (
  inviterId: string,
  inviteeEmail: string,
  role: 'Admin' | 'Member' | 'Viewer' = 'Member'
) => {
  // Check if inviter is admin
  const inviter = await User.findByPk(inviterId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "org_code"],
        required: false,
      },
    ],
  });
  if (!inviter || inviter.role !== 'Admin') {
    throw new Error('Only administrators can send invites');
  }

  if (!inviter.organization_id) {
    throw new Error('Administrator must belong to an organization before inviting users');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email: inviteeEmail } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check if there's already a pending invite
  const existingInvite = await Invite.findOne({
    where: {
      invitee_email: inviteeEmail,
      status: 'pending'
    }
  });
  if (existingInvite) {
    throw new Error('Pending invite already exists for this email');
  }

  const inviteCode = generateInviteCode();
  const orgAccessCode = await createUniqueOrgAccessCode();
  const temporaryPassword = generateTemporaryPassword();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create the invite
  const invite = await Invite.create({
    inviter_id: inviterId,
    invitee_email: inviteeEmail,
    invite_code: inviteCode,
    org_code: orgAccessCode,
    temporary_password: temporaryPassword,
    expires_at: expiresAt,
  });

  // Create user account immediately with temporary password
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  const newUser = await User.create({
    email: inviteeEmail,
    password_hash: hashedPassword,
    full_name: inviteeEmail.split('@')[0], // Use email prefix as default name
    role: role,
    password_reset_required: true,
    is_invited_user: true,
    organization_id: inviter.organization_id,
  });

  // Update invite with the created user ID
  await invite.update({ invitee_id: newUser.id, org_code: orgAccessCode });

  // Send welcome email with temporary password
  try {
    await sendWelcomeEmail(inviteeEmail, temporaryPassword, newUser.full_name);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't throw error - user is created, they can still login
  }

  return {
    invite,
    user: newUser,
    orgCode: orgAccessCode,
    temporaryPassword, // Return for testing purposes
  };
};

export const acceptInvite = async (inviteCode: string, newPassword: string, fullName?: string) => {
  const invite = await Invite.findOne({
    where: { invite_code: inviteCode, status: 'pending' },
    include: [{ model: User, as: 'invitee' }]
  });

  if (!invite) {
    throw new Error('Invalid or expired invite code');
  }

  if (invite.expires_at && new Date() > invite.expires_at) {
    await invite.update({ status: 'expired' });
    throw new Error('Invite has expired');
  }

  if (!invite.invitee) {
    throw new Error('User account not found for this invite');
  }

  // Update user with new password and remove reset requirement
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await invite.invitee.update({
    password_hash: hashedPassword,
    password_reset_required: false,
    full_name: fullName || invite.invitee.full_name,
  });

  // Mark invite as accepted
  await invite.update({
    status: 'accepted',
    accepted_at: new Date(),
  });

  return invite.invitee;
};

export const getInviteByCode = async (inviteCode: string) => {
  return await Invite.findOne({
    where: { invite_code: inviteCode },
    include: [
      { model: User, as: 'inviter', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'invitee', attributes: ['id', 'full_name', 'email'] }
    ]
  });
};

export const getInvitesByInviter = async (inviterId: string) => {
  return await Invite.findAll({
    where: { inviter_id: inviterId },
    include: [
      { model: User, as: 'invitee', attributes: ['id', 'full_name', 'email', 'role', 'avatar_url'] }
    ],
    order: [['created_at', 'DESC']]
  });
};
