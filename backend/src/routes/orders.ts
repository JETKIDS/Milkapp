import { Router } from 'express';
import { ordersService } from '../services/ordersService';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, sortKey, sortDir, customerId } = req.query as any;
    const p = Number(page) || 1;
    const ps = Math.min(Number(pageSize) || 10, 100);
    const prisma = (await import('../lib/prisma')).default;
    const where: any = customerId ? { customerId: Number(customerId) } : {};
    const orderBy = sortKey ? { [String(sortKey)]: (String(sortDir) === 'desc' ? 'desc' : 'asc') } : { id: 'asc' } as any;
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, orderBy, skip: (p - 1) * ps, take: ps }),
    ]);
    res.setHeader('X-Total-Count', String(total));
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.get('/by-customer/:customerId', async (req, res, next) => {
  try {
    const customerId = Number((req.params as any).customerId);
    const { from, to } = req.query as { from?: string; to?: string };
    const items = await ordersService.listByCustomer(customerId, from, to);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await ordersService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await ordersService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await ordersService.remove(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;


