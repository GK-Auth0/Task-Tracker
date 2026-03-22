import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  sendInvite,
  getInviteDetails,
  acceptInviteCode,
  getMyInvites,
  changeInvitedUserPassword,
} from '../controllers/invite';

const router = express.Router();

// Admin only routes
router.post('/send', authenticateToken, requireAdmin, sendInvite);
router.get('/my-invites', authenticateToken, requireAdmin, getMyInvites);

// Public routes (for accepting invites)
router.get('/:inviteCode', getInviteDetails);
router.post('/:inviteCode/accept', acceptInviteCode);

// Password change for invited users
router.post('/change-password', changeInvitedUserPassword);

export default router;