"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersService = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
const customersRepository_1 = require("../repositories/customersRepository");
exports.createCustomerSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    name: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional().nullable(),
    collectionMethod: zod_1.z.string().optional().nullable(),
    bankBranchCode7: zod_1.z.string().regex(/^\d{7}$/).optional().nullable(),
    accountNumber7: zod_1.z.string().regex(/^\d{7}$/).optional().nullable(),
    accountHolderKana: zod_1.z.string().regex(/^[\u30A0-\u30FF\uFF65-\uFF9F\s]+$/).optional().nullable(),
    customerCode7: zod_1.z.string().regex(/^\d{7}$/).optional().nullable(),
    email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    deliveryCourseId: zod_1.z.number().int().positive().optional().nullable(),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
exports.customersService = {
    async list() {
        return customersRepository_1.customersRepository.list();
    },
    async create(input) {
        const data = exports.createCustomerSchema.parse(input);
        return customersRepository_1.customersRepository.create(data);
    },
    async update(id, input) {
        const data = exports.updateCustomerSchema.parse(input);
        return customersRepository_1.customersRepository.update(id, data);
    },
    async remove(id) {
        await customersRepository_1.customersRepository.remove(id);
    },
};
