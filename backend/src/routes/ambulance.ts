import { Router } from 'express';

const router = Router();

router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;
  res.json({ ambulances: [] });
});

router.post('/request', async (req, res) => {
  res.json({ orderCode: '', ambulanceId: '' });
});

export default router;
