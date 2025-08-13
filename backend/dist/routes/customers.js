"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customersService_1 = require("../services/customersService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const customers = await customersService_1.customersService.list();
        res.json({ success: true, data: customers });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await customersService_1.customersService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await customersService_1.customersService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await customersService_1.customersService.remove(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
