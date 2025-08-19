"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersService = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
const customersRepository_1 = require("../repositories/customersRepository");
exports.createCustomerSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    name: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    deliveryCourseId: zod_1.z.number().int().positive().optional(),
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
