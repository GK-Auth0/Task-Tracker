import { Request, Response } from 'express';
import { createInvite, acceptInvite, getInviteByCode, getInvitesByInviter } from '../services/inviteService';
import { changePasswordForInvitedUser } from '../services/auth';

export const sendInvite = async (req: Request, res: Response) => {
  try {
    const inviterId = (req as any).user?.id;
    const { email, role = 'Member' } = req.body;

    if (!inviterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID required',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await createInvite(inviterId, email, role);

    return res.status(201).json({
      success: true,
      message: 'Invite sent successfully',
      data: {
        inviteCode: result.invite.invite_code,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to send invite',
      error: (error as any).message,
    });
  }
};

export const getInviteDetails = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid invite code is required',
      });
    }

    const invite = await getInviteByCode(inviteCode);

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invite not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        inviteCode: invite.invite_code,
        inviterName: invite.inviter?.full_name,
        inviteeEmail: invite.invitee_email,
        status: invite.status,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get invite details',
      error: (error as any).message,
    });
  }
};

export const acceptInviteCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const { newPassword, fullName } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid invite code is required',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    const user = await acceptInvite(inviteCode, newPassword, fullName);

    return res.status(200).json({
      success: true,
      message: 'Invite accepted successfully',
      data: {
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to accept invite',
      error: (error as any).message,
    });
  }
};

export const getMyInvites = async (req: Request, res: Response) => {
  try {
    const inviterId = (req as any).user?.id;

    if (!inviterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID required',
      });
    }

    const invites = await getInvitesByInviter(inviterId);

    return res.status(200).json({
      success: true,
      data: invites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get invites',
      error: (error as any).message,
    });
  }
};

export const changeInvitedUserPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    await changePasswordForInvitedUser(email, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to change password',
      error: (error as any).message,
    });
  }
};