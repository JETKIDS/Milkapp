"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternsRouter = void 0;
const express_1 = require("express");
const contractsService_1 = require("../services/contractsService");
const router = (0, express_1.Router)({ mergeParams: true });
// /api/customers/:id/contracts
router.get('/', async (req, res, next) => {
    try {
        const customerId = Number(req.params.id);
        const items = await contractsService_1.contractsService.listByCustomer(customerId);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await contractsService_1.contractsService.createContract({ ...req.body, customerId: Number(req.params.id) });
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:contractId', async (req, res, next) => {
    try {
        const id = Number(req.params.contractId);
        const updated = await contractsService_1.contractsService.updateContract(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.delete('/:contractId', async (req, res, next) => {
    try {
        const id = Number(req.params.contractId);
        await contractsService_1.contractsService.removeContract(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
// /api/customers/:id/delivery-patterns
exports.patternsRouter = (0, express_1.Router)();
exports.patternsRouter.get('/:contractId', async (req, res, next) => {
    try {
        const contractId = Number(req.params.contractId);
        const items = await contractsService_1.contractsService.listPatterns(contractId);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
exports.patternsRouter.post('/', async (req, res, next) => {
    try {
        const created = await contractsService_1.contractsService.createPattern(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
exports.patternsRouter.put('/:patternId', async (req, res, next) => {
    try {
        const id = Number(req.params.patternId);
        const updated = await contractsService_1.contractsService.updatePattern(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
exports.patternsRouter.delete('/:patternId', async (req, res, next) => {
    try {
        const id = Number(req.params.patternId);
        await contractsService_1.contractsService.removePattern(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
