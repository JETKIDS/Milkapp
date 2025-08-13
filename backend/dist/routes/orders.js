"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ordersService_1 = require("../services/ordersService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await ordersService_1.ordersService.list();
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.get('/by-customer/:customerId', async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        const { from, to } = req.query;
        const items = await ordersService_1.ordersService.listByCustomer(customerId, from, to);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await ordersService_1.ordersService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await ordersService_1.ordersService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await ordersService_1.ordersService.remove(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
