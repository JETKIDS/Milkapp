"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRecordsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.deliveryRecordsRepository = {
    async list(filter) {
        const where = {};
        if (filter.customerId)
            where.customerId = filter.customerId;
        if (filter.from || filter.to) {
            where.deliveryDate = {};
            if (filter.from)
                where.deliveryDate.gte = filter.from;
            if (filter.to)
                where.deliveryDate.lte = filter.to;
        }
        return prisma_1.default.deliveryRecord.findMany({ where, orderBy: { deliveryDate: 'asc' } });
    },
    async update(id, input) {
        return prisma_1.default.deliveryRecord.update({ where: { id }, data: input });
    },
    async findById(id) {
        return prisma_1.default.deliveryRecord.findUnique({ where: { id } });
    },
};
