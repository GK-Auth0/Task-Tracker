import { Router, Request, Response } from 'express';

const router = Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'API is running' });
});

export default router;