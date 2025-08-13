import { Router } from 'express';
import { dashboardService } from '../services/dashboardService';

const router = Router();

router.get('/today', async (_req, res, next) => {
  try { res.json({ success: true, data: await dashboardService.today() }); } catch (e) { next(e); }
});
router.get('/pending-deliveries', async (_req, res, next) => {
  try { res.json({ success: true, data: await dashboardService.pendingDeliveries() }); } catch (e) { next(e); }
});
router.get('/delivery-status', async (_req, res, next) => {
  try { res.json({ success: true, data: await dashboardService.deliveryStatus() }); } catch (e) { next(e); }
});
router.get('/monthly-summary', async (_req, res, next) => {
  try { res.json({ success: true, data: await dashboardService.monthlySummary() }); } catch (e) { next(e); }
});

export default router;


