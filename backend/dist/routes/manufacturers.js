"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manufacturersService_1 = require("../services/manufacturersService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await manufacturersService_1.manufacturersService.list();
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await manufacturersService_1.manufacturersService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await manufacturersService_1.manufacturersService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await manufacturersService_1.manufacturersService.remove(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
