import { Router } from 'express';
import { customerDetailService } from '../services/customerDetailService';

const router = Router({ mergeParams: true });

router.get('/detail', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const data = await customerDetailService.getDetail(id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/delivery-schedule', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const data = await customerDetailService.getDeliverySchedule(id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/monthly-calendar/:year/:month', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const data = await customerDetailService.getMonthlyCalendar(id, year, month);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/monthly-billing/:year/:month', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const data = await customerDetailService.getMonthlyBilling(id, year, month);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/course-position', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const data = await customerDetailService.getCoursePosition(id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.put('/course-position', async (req, res, next) => {
  try {
    const id = Number((req.params as any).id);
    const { courseId, position } = req.body as { courseId: number; position: number };
    const data = await customerDetailService.setCoursePosition(id, Number(courseId), Number(position));
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;


