"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.contractsRepository = {
    // contracts
    async listByCustomer(customerId) {
        return prisma_1.default.customerProductContract.findMany({ where: { customerId }, include: { product: true, patterns: true } });
    },
    async createContract(input) {
        return prisma_1.default.customerProductContract.create({
            data: {
                customerId: input.customerId,
                productId: input.productId,
                isActive: input.isActive ?? true,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : undefined,
            },
        });
    },
    async updateContract(id, input) {
        const data = { ...input };
        if (input.startDate)
            data.startDate = new Date(input.startDate);
        if (input.endDate)
            data.endDate = new Date(input.endDate);
        return prisma_1.default.customerProductContract.update({ where: { id }, data });
    },
    async removeContract(id) {
        await prisma_1.default.$transaction([
            prisma_1.default.deliveryPattern.deleteMany({ where: { contractId: id } }),
            prisma_1.default.customerProductContract.delete({ where: { id } }),
        ]);
    },
    // patterns
    async listPatterns(contractId) {
        return prisma_1.default.deliveryPattern.findMany({ where: { contractId } });
    },
    async createPattern(input) {
        return prisma_1.default.deliveryPattern.create({
            data: {
                contractId: input.contractId,
                dayOfWeek: input.dayOfWeek,
                quantity: input.quantity,
                isActive: input.isActive ?? true,
            },
        });
    },
    async updatePattern(id, input) {
        return prisma_1.default.deliveryPattern.update({ where: { id }, data: input });
    },
    async removePattern(id) {
        return prisma_1.default.deliveryPattern.delete({ where: { id } });
    },
};
