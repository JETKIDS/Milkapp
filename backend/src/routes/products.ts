import { Router } from 'express';
import { productsService } from '../services/productsService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await productsService.list();
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await productsService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await productsService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await productsService.remove(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;


