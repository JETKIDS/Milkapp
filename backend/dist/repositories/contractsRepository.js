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
        return prisma_1.default.customerProductContract.findMany({ where: { customerId }, include: { product: true, patterns: true, pauses: true } });
    },
    async createContract(input) {
        // 契約を作成
        const contract = await prisma_1.default.customerProductContract.create({
            data: {
                customerId: input.customerId,
                productId: input.productId,
                unitPrice: input.unitPrice,
                patternType: input.patternType,
                isActive: input.isActive ?? true,
                startDate: new Date(input.startDate),
            },
        });
        // 各曜日の配達パターンを作成
        const patterns = [];
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < days.length; i++) {
            const dayKey = days[i];
            const quantity = input[dayKey];
            if (quantity && quantity > 0) {
                patterns.push({
                    contractId: contract.id,
                    dayOfWeek: i, // 0=日曜, 1=月曜, ...
                    quantity: quantity,
                    isActive: true,
                });
            }
        }
        // パターンがある場合は一括作成
        if (patterns.length > 0) {
            await prisma_1.default.deliveryPattern.createMany({
                data: patterns,
            });
        }
        return contract;
    },
    async updateContract(id, input) {
        const data = { ...input };
        if (input.startDate)
            data.startDate = new Date(input.startDate);
        return prisma_1.default.customerProductContract.update({ where: { id }, data });
    },
    async removeContract(id) {
        await prisma_1.default.$transaction([
            prisma_1.default.deliveryPattern.deleteMany({ where: { contractId: id } }),
            prisma_1.default.customerProductContract.delete({ where: { id } }),
        ]);
    },
    async cancelContract(id, cancelDate) {
        // 解約日を設定し、契約を非アクティブにする
        return prisma_1.default.customerProductContract.update({
            where: { id },
            data: {
                cancelDate: new Date(cancelDate),
                isActive: false,
            },
        });
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
    // pauses
    async createPause(contractId, startDateISO, endDateISO) {
        return prisma_1.default.contractPause.create({ data: { contractId, startDate: new Date(startDateISO), endDate: new Date(endDateISO) } });
    },
};
