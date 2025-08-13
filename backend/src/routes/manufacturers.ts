import { Router } from 'express';
import { manufacturersService } from '../services/manufacturersService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await manufacturersService.list();
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await manufacturersService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await manufacturersService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await manufacturersService.remove(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;


