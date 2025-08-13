"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.ordersRepository = {
    async list() {
        return prisma_1.default.order.findMany({ orderBy: { id: 'asc' } });
    },
    async listByCustomer(customerId, from, to) {
        const where = { customerId };
        if (from || to) {
            where.orderDate = {};
            if (from)
                where.orderDate.gte = from;
            if (to)
                where.orderDate.lte = to;
        }
        return prisma_1.default.order.findMany({ where, orderBy: { orderDate: 'asc' } });
    },
    async create(input) {
        const totalPrice = input.quantity * input.unitPrice;
        return prisma_1.default.order.create({
            data: {
                customerId: input.customerId,
                productId: input.productId,
                quantity: input.quantity,
                unitPrice: input.unitPrice,
                totalPrice,
                orderDate: new Date(input.orderDate),
                deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
            },
        });
    },
    async update(id, input) {
        const data = { ...input };
        if (input.orderDate)
            data.orderDate = new Date(input.orderDate);
        if (input.deliveryDate)
            data.deliveryDate = new Date(input.deliveryDate);
        if (input.quantity != null && input.unitPrice != null) {
            data.totalPrice = input.quantity * input.unitPrice;
        }
        return prisma_1.default.order.update({ where: { id }, data });
    },
    async remove(id) {
        return prisma_1.default.order.delete({ where: { id } });
    },
    async countByProduct(productId) {
        return prisma_1.default.order.count({ where: { productId } });
    },
};
