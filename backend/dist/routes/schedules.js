"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedulesService_1 = require("../services/schedulesService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const { page, pageSize, sortKey, sortDir, customerId } = req.query;
        const p = Number(page) || 1;
        const ps = Math.min(Number(pageSize) || 10, 100);
        const prisma = (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default;
        const where = customerId ? { customerId: Number(customerId) } : {};
        const orderBy = sortKey ? { [String(sortKey)]: (String(sortDir) === 'desc' ? 'desc' : 'asc') } : { id: 'asc' };
        const [total, items] = await Promise.all([
            prisma.deliverySchedule.count({ where }),
            prisma.deliverySchedule.findMany({ where, orderBy, skip: (p - 1) * ps, take: ps }),
        ]);
        res.setHeader('X-Total-Count', String(total));
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
