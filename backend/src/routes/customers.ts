import { Router } from 'express';
import { customersService } from '../services/customersService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const customers = await customersService.list();
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await customersService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await customersService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await customersService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;


