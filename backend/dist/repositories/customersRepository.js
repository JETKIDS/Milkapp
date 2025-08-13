"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.customersRepository = {
    async list() {
        return prisma_1.default.customer.findMany({ orderBy: { id: 'asc' } });
    },
    async create(input) {
        return prisma_1.default.customer.create({ data: input });
    },
    async findById(id) {
        return prisma_1.default.customer.findUnique({ where: { id } });
    },
    async update(id, input) {
        return prisma_1.default.customer.update({ where: { id }, data: input });
    },
    async remove(id) {
        return prisma_1.default.customer.delete({ where: { id } });
    },
};
