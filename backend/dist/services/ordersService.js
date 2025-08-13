"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersService = exports.orderUpdateSchema = exports.orderCreateSchema = void 0;
const zod_1 = require("zod");
const ordersRepository_1 = require("../repositories/ordersRepository");
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.orderCreateSchema = zod_1.z.object({
    customerId: zod_1.z.number().int().positive(),
    productId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().int().nonnegative(),
    orderDate: zod_1.z.string().datetime(),
    deliveryDate: zod_1.z.string().datetime().optional(),
});
exports.orderUpdateSchema = exports.orderCreateSchema.partial().extend({
    status: zod_1.z.enum(['pending', 'completed', 'cancelled']).optional(),
});
exports.ordersService = {
    async list() {
        return ordersRepository_1.ordersRepository.list();
    },
    async listByCustomer(customerId, from, to) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        return ordersRepository_1.ordersRepository.listByCustomer(customerId, fromDate, toDate);
    },
    async create(input) {
        const data = exports.orderCreateSchema.parse(input);
        // 在庫チェック
        const product = await prisma_1.default.product.findUnique({ where: { id: data.productId } });
        if (!product) {
            const err = new Error('商品が見つかりません');
            // @ts-ignore
            err.code = 'PRODUCT_NOT_FOUND';
            throw err;
        }
        if (product.stock < data.quantity) {
            const err = new Error('在庫数量を超過しています');
            // @ts-ignore
            err.code = 'INSUFFICIENT_STOCK';
            // 警告だが保存はする仕様にするならここで続行、今回は要件に従い保存前にエラー
            throw err;
        }
        // 保存時に出荷で在庫減少させる簡易運用
        const created = await ordersRepository_1.ordersRepository.create(data);
        await prisma_1.default.product.update({
            where: { id: data.productId },
            data: { stock: product.stock - data.quantity },
        });
        return created;
    },
    async update(id, input) {
        const data = exports.orderUpdateSchema.parse(input);
        return ordersRepository_1.ordersRepository.update(id, data);
    },
    async remove(id) {
        await ordersRepository_1.ordersRepository.remove(id);
    },
};
