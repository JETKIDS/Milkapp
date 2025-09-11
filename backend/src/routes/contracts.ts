import { Router } from 'express';
import { contractsService } from '../services/contractsService';

const router = Router({ mergeParams: true });

// /api/customers/:id/contracts
router.get('/', async (req, res, next) => {
  try {
    const customerId = Number((req.params as any).id);
    const items = await contractsService.listByCustomer(customerId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const customerId = Number((req.params as any).id);
    const created = await contractsService.createContract(customerId, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.put('/:contractId', async (req, res, next) => {
  try {
    const id = Number(req.params.contractId);
    const updated = await contractsService.updateContract(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/:contractId/cancel', async (req, res, next) => {
  try {
    const id = Number(req.params.contractId);
    const { cancelDate } = req.body;
    const updated = await contractsService.cancelContract(id, cancelDate);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

// /api/customers/:id/contracts/:contractId/patterns
export const patternsRouter = Router();

patternsRouter.get('/:contractId', async (req, res, next) => {
  try {
    const contractId = Number(req.params.contractId);
    const items = await contractsService.listPatterns(contractId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

patternsRouter.post('/', async (req, res, next) => {
  try {
    const created = await contractsService.createPattern(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

patternsRouter.put('/:patternId', async (req, res, next) => {
  try {
    const id = Number(req.params.patternId);
    const updated = await contractsService.updatePattern(id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

patternsRouter.delete('/:patternId', async (req, res, next) => {
  try {
    const id = Number(req.params.patternId);
    await contractsService.removePattern(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;

// 休配
export const pausesRouter = Router({ mergeParams: true });
pausesRouter.post('/:contractId/pauses', async (req, res, next) => {
  try {
    const id = Number(req.params.contractId);
    const created = await contractsService.createPause(id, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

// パターン変更履歴
export const patternChangesRouter = Router({ mergeParams: true });

patternChangesRouter.get('/:contractId/pattern-changes', async (req, res, next) => {
  try {
    const contractId = Number(req.params.contractId);
    const items = await contractsService.listPatternChanges(contractId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

patternChangesRouter.post('/:contractId/pattern-changes', async (req, res, next) => {
  try {
    const contractId = Number(req.params.contractId);
    const created = await contractsService.createPatternChange({ ...req.body, contractId });
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

patternChangesRouter.put('/:contractId/pattern-changes/:changeId', async (req, res, next) => {
  try {
    const changeId = Number(req.params.changeId);
    const updated = await contractsService.updatePatternChange(changeId, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

patternChangesRouter.delete('/:contractId/pattern-changes/:changeId', async (req, res, next) => {
  try {
    const changeId = Number(req.params.changeId);
    await contractsService.removePatternChange(changeId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

patternChangesRouter.get('/:contractId/pattern-changes/by-date/:date', async (req, res, next) => {
  try {
    const contractId = Number(req.params.contractId);
    const targetDate = req.params.date;
    const item = await contractsService.getPatternChangesByDate(contractId, targetDate);
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
});


