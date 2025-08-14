import { Router } from 'express';
import { deliveryCoursesService } from '../services/deliveryCoursesService';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { q, page, pageSize, sortKey, sortDir } = req.query as any;
    const p = Number(page) || 1;
    const ps = Math.min(Number(pageSize) || 10, 100);
    const prisma = (await import('../lib/prisma')).default;
    const where: any = q ? { name: { contains: String(q) } } : {};
    const orderBy = sortKey ? { [String(sortKey)]: (String(sortDir) === 'desc' ? 'desc' : 'asc') } : { id: 'asc' } as any;
    const [total, items] = await Promise.all([
      prisma.deliveryCourse.count({ where }),
      prisma.deliveryCourse.findMany({ where, orderBy, skip: (p - 1) * ps, take: ps }),
    ]);
    res.setHeader('X-Total-Count', String(total));
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


