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
const deliveryCoursesService_1 = require("../services/deliveryCoursesService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const { q, page, pageSize, sortKey, sortDir } = req.query;
        const p = Number(page) || 1;
        const ps = Math.min(Number(pageSize) || 10, 100);
        const prisma = (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default;
        const where = q ? { name: { contains: String(q) } } : {};
        const orderBy = sortKey ? { [String(sortKey)]: (String(sortDir) === 'desc' ? 'desc' : 'asc') } : { id: 'asc' };
        const [total, items] = await Promise.all([
            prisma.deliveryCourse.count({ where }),
            prisma.deliveryCourse.findMany({ where, orderBy, skip: (p - 1) * ps, take: ps }),
        ]);
        res.setHeader('X-Total-Count', String(total));
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const course = await deliveryCoursesService_1.deliveryCoursesService.getById(id);
        res.json({ success: true, data: course });
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
// 顧客のコース間移動（フロントエンドからの新しいエンドポイント）
// 注意: /:id より前に配置する必要がある
router.put('/transfer-customer', async (req, res, next) => {
    try {
        const { customerId, targetCourseId } = req.body;
        // 顧客の現在のコースIDを取得
        const prisma = (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default;
        const customer = await prisma.customer.findUnique({
            where: { id: Number(customerId) },
            select: { deliveryCourseId: true }
        });
        if (!customer) {
            return res.status(404).json({ success: false, error: '顧客が見つかりません' });
        }
        const fromCourseId = customer.deliveryCourseId ?? 0;
        await deliveryCoursesService_1.deliveryCoursesService.transferCustomer(Number(customerId), fromCourseId, Number(targetCourseId));
        res.json({ success: true });
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
// コース詳細（顧客一覧含む）取得
router.get('/:id/customers', async (req, res, next) => {
    try {
        const courseId = Number(req.params.id);
        const customers = await deliveryCoursesService_1.deliveryCoursesService.getCourseCustomers(courseId);
        res.json({ success: true, data: customers });
    }
    catch (e) {
        next(e);
    }
});
// コース内顧客の順番変更
router.put('/:id/customers/reorder', async (req, res, next) => {
    try {
        const courseId = Number(req.params.id);
        const { customerIds } = req.body; // 新しい順番の顧客IDの配列
        await deliveryCoursesService_1.deliveryCoursesService.reorderCustomers(courseId, customerIds);
        res.json({ success: true });
    }
    catch (e) {
        next(e);
    }
});
// 顧客のコース移動
router.put('/:id/customers/:customerId/transfer', async (req, res, next) => {
    try {
        const fromCourseId = Number(req.params.id);
        const customerId = Number(req.params.customerId);
        const { toCourseId, position } = req.body;
        await deliveryCoursesService_1.deliveryCoursesService.transferCustomer(customerId, fromCourseId, toCourseId, position);
        res.json({ success: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
