"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsService = exports.patternUpdateSchema = exports.patternCreateSchema = exports.contractUpdateSchema = exports.contractCreateSchema = void 0;
const zod_1 = require("zod");
const contractsRepository_1 = require("../repositories/contractsRepository");
exports.contractCreateSchema = zod_1.z.object({
    customerId: zod_1.z.number().int().positive(),
    productId: zod_1.z.number().int().positive(),
    isActive: zod_1.z.boolean().optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.contractUpdateSchema = exports.contractCreateSchema.partial();
exports.patternCreateSchema = zod_1.z.object({
    contractId: zod_1.z.number().int().positive(),
    dayOfWeek: zod_1.z.number().int().min(0).max(6),
    quantity: zod_1.z.number().int().positive(),
    isActive: zod_1.z.boolean().optional(),
});
exports.patternUpdateSchema = exports.patternCreateSchema.partial();
exports.contractsService = {
    async listByCustomer(customerId) {
        return contractsRepository_1.contractsRepository.listByCustomer(customerId);
    },
    async createContract(input) {
        const data = exports.contractCreateSchema.parse(input);
        return contractsRepository_1.contractsRepository.createContract(data);
    },
    async updateContract(id, input) {
        const data = exports.contractUpdateSchema.parse(input);
        return contractsRepository_1.contractsRepository.updateContract(id, data);
    },
    async removeContract(id) {
        await contractsRepository_1.contractsRepository.removeContract(id);
    },
    async listPatterns(contractId) {
        return contractsRepository_1.contractsRepository.listPatterns(contractId);
    },
    async createPattern(input) {
        const data = exports.patternCreateSchema.parse(input);
        return contractsRepository_1.contractsRepository.createPattern(data);
    },
    async updatePattern(id, input) {
        const data = exports.patternUpdateSchema.parse(input);
        return contractsRepository_1.contractsRepository.updatePattern(id, data);
    },
    async removePattern(id) {
        await contractsRepository_1.contractsRepository.removePattern(id);
    },
};
