import { Router } from 'express';
import { schedulesService } from '../services/schedulesService';

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
      prisma.deliverySchedule.count({ where }),
      prisma.deliverySchedule.findMany({ where, orderBy, skip: (p - 1) * ps, take: ps }),
    ]);
    res.setHeader('X-Total-Count', String(total));
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.get('/by-day/:day', async (req, res, next) => {
  try {
    const day = Number(req.params.day);
    const items = await schedulesService.listByDay(day);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.get('/by-course/:courseId', async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const items = await schedulesService.listByCourse(courseId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await schedulesService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await schedulesService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/complete/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const dateISO = (req.body?.date as string) ?? new Date().toISOString();
    const record = await schedulesService.complete(id, dateISO);
    res.status(201).json({ success: true, data: record });
  } catch (e) {
    next(e);
  }
});

router.get('/history/by-customer/:customerId', async (req, res, next) => {
  try {
    const customerId = Number((req.params as any).customerId);
    const { from, to } = req.query as { from?: string; to?: string };
    const items = await schedulesService.historyByCustomer(customerId, from, to);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

export default router;


