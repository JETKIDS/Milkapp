import { Router } from 'express';
import { deliveryCoursesService } from '../services/deliveryCoursesService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await deliveryCoursesService.list();
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await deliveryCoursesService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await deliveryCoursesService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await deliveryCoursesService.remove(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;


