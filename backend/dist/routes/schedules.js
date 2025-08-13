"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedulesService_1 = require("../services/schedulesService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await schedulesService_1.schedulesService.list();
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.get('/by-day/:day', async (req, res, next) => {
    try {
        const day = Number(req.params.day);
        const items = await schedulesService_1.schedulesService.listByDay(day);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.get('/by-course/:courseId', async (req, res, next) => {
    try {
        const courseId = Number(req.params.courseId);
        const items = await schedulesService_1.schedulesService.listByCourse(courseId);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await schedulesService_1.schedulesService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await schedulesService_1.schedulesService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.post('/complete/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const dateISO = req.body?.date ?? new Date().toISOString();
        const record = await schedulesService_1.schedulesService.complete(id, dateISO);
        res.status(201).json({ success: true, data: record });
    }
    catch (e) {
        next(e);
    }
});
router.get('/history/by-customer/:customerId', async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        const { from, to } = req.query;
        const items = await schedulesService_1.schedulesService.historyByCustomer(customerId, from, to);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
