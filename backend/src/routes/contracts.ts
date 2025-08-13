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
    const created = await contractsService.createContract({ ...req.body, customerId: Number((req.params as any).id) });
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

router.delete('/:contractId', async (req, res, next) => {
  try {
    const id = Number(req.params.contractId);
    await contractsService.removeContract(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// /api/customers/:id/delivery-patterns
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


