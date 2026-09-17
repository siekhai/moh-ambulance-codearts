import { Router } from 'express';

const router = Router();

router.get('/:id/status', async (req, res) => {
  res.json({ status: 'preparing', timeline: [] });
});

export default router;
