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
const customersService_1 = require("../services/customersService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const { idSearch, nameSearch, phoneSearch, addressSearch, page, pageSize, sortKey, sortDir, all } = req.query;
        const p = Number(page) || 1;
        const ps = Math.min(Number(pageSize) || 10, 100);
        const returnAll = String(all).toLowerCase() === '1' || String(all).toLowerCase() === 'true';
        let where = {};
        const conditions = [];
        // ID検索
        if (idSearch) {
            const idNum = parseInt(String(idSearch));
            if (!isNaN(idNum)) {
                conditions.push({ id: idNum });
            }
        }
        // 名前検索
        if (nameSearch) {
            conditions.push({ name: { contains: String(nameSearch) } });
        }
        // 電話番号検索
        if (phoneSearch) {
            conditions.push({ phone: { contains: String(phoneSearch) } });
        }
        // 住所検索
        if (addressSearch) {
            conditions.push({ address: { contains: String(addressSearch) } });
        }
        // 複数の検索条件がある場合はAND条件で結合
        if (conditions.length > 0) {
            where = { AND: conditions };
        }
        const prisma = (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default;
        const total = await prisma.customer.count({ where });
        // orderByを安全に構築
        let orderBy = { id: 'asc' };
        if (sortKey && typeof sortKey === 'string') {
            // 有効なソートキーのみ許可
            const validSortKeys = ['id', 'name', 'address', 'phone', 'email', 'createdAt', 'updatedAt'];
            if (validSortKeys.includes(sortKey)) {
                const direction = String(sortDir) === 'desc' ? 'desc' : 'asc';
                orderBy = { [sortKey]: direction };
            }
        }
        const items = await prisma.customer.findMany({
            where,
            orderBy,
            ...(returnAll ? {} : { skip: (p - 1) * ps, take: ps }),
        });
        res.setHeader('X-Total-Count', String(total));
        res.json({ success: true, data: items });
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
