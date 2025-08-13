"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productsService_1 = require("../services/productsService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const items = await productsService_1.productsService.list();
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const created = await productsService_1.productsService.create(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const updated = await productsService_1.productsService.update(id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (e) {
        next(e);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await productsService_1.productsService.remove(id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
