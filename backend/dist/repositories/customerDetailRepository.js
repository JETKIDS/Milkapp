"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerDetailRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.customerDetailRepository = {
    async getDetail(customerId) {
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: customerId },
            include: {
                deliveryCourse: true,
                schedules: true,
                contracts: { include: { product: true, patterns: true } },
            },
        });
        if (!customer)
            return null;
        const position = await prisma_1.default.customerCoursePosition.findFirst({
            where: { customerId: customerId, deliveryCourseId: customer.deliveryCourseId ?? undefined },
        });
        return { customer, position: position?.position ?? null };
    },
    async getMonthlyCalendar(customerId, year, month) {
        // モック: 契約パターンをカレンダーに展開せず、簡易レスポンス
        const contracts = await prisma_1.default.customerProductContract.findMany({
            where: { customerId },
            include: { product: true, patterns: true },
        });
        return { year, month, contracts };
    },
    async getMonthlyBilling(customerId, year, month) {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
        const orders = await prisma_1.default.order.findMany({ where: { customerId, orderDate: { gte: start, lte: end } } });
        const total = orders.reduce((a, o) => a + o.totalPrice, 0);
        return { year, month, total };
    },
    async getCoursePosition(customerId) {
        return prisma_1.default.customerCoursePosition.findMany({ where: { customerId } });
    },
    async setCoursePosition(customerId, courseId, position) {
        return prisma_1.default.customerCoursePosition.upsert({
            where: { customerId_deliveryCourseId: { customerId, deliveryCourseId: courseId } },
            update: { position },
            create: { customerId, deliveryCourseId: courseId, position },
        });
    },
};
