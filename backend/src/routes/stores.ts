import { Router } from 'express';
import { storesService } from '../services/storesService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await storesService.list();
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await storesService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

export default router;


