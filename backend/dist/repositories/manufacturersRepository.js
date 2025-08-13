"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manufacturersRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.manufacturersRepository = {
    async list() {
        return prisma_1.default.manufacturer.findMany({ orderBy: { id: 'asc' } });
    },
    async create(input) {
        return prisma_1.default.manufacturer.create({ data: input });
    },
    async update(id, input) {
        return prisma_1.default.manufacturer.update({ where: { id }, data: input });
    },
    async remove(id) {
        return prisma_1.default.manufacturer.delete({ where: { id } });
    },
    async countProducts(id) {
        return prisma_1.default.product.count({ where: { manufacturerId: id } });
    },
};
