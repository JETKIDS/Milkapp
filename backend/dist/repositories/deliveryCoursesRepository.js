"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryCoursesRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.deliveryCoursesRepository = {
    async list() {
        return prisma_1.default.deliveryCourse.findMany({ orderBy: { id: 'asc' } });
    },
    async create(input) {
        return prisma_1.default.deliveryCourse.create({ data: input });
    },
    async update(id, input) {
        return prisma_1.default.deliveryCourse.update({ where: { id }, data: input });
    },
    async remove(id) {
        return prisma_1.default.deliveryCourse.delete({ where: { id } });
    },
    async countCustomers(id) {
        return prisma_1.default.customer.count({ where: { deliveryCourseId: id } });
    },
};
