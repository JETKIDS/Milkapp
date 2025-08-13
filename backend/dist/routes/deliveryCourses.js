"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryCoursesService_1 = require("../services/deliveryCoursesService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await deliveryCoursesService_1.deliveryCoursesService.list();
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await deliveryCoursesService_1.deliveryCoursesService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await deliveryCoursesService_1.deliveryCoursesService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await deliveryCoursesService_1.deliveryCoursesService.remove(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
