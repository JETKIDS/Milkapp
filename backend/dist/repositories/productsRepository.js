"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.productsRepository = {
    async list() {
        return prisma_1.default.product.findMany({ orderBy: { id: 'asc' } });
    },
    async create(input) {
        return prisma_1.default.product.create({ data: input });
    },
    async update(id, input) {
        return prisma_1.default.product.update({ where: { id }, data: input });
    },
    async remove(id) {
        return prisma_1.default.product.delete({ where: { id } });
    },
    async countOrders(productId) {
        return prisma_1.default.order.count({ where: { productId } });
    },
};
