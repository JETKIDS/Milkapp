"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
function startOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function endOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}
exports.dashboardRepository = {
    async todayDeliveryCount(dayOfWeek) {
        return prisma_1.default.deliverySchedule.count({ where: { dayOfWeek, isActive: true } });
    },
    async pendingDeliveries(dayOfWeek, today) {
        const [schedules, records] = await Promise.all([
            prisma_1.default.deliverySchedule.findMany({
                where: { dayOfWeek, isActive: true },
                include: { customer: { select: { id: true, name: true, address: true, deliveryCourseId: true } } },
            }),
            prisma_1.default.deliveryRecord.findMany({
                where: { deliveryDate: { gte: startOfDay(today), lte: endOfDay(today) }, status: 'completed' },
                select: { customerId: true },
            }),
        ]);
        const completedSet = new Set(records.map((r) => r.customerId));
        return schedules
            .filter((s) => !completedSet.has(s.customerId))
            .map((s) => ({ customerId: s.customer.id, name: s.customer.name, address: s.customer.address, courseId: s.customer.deliveryCourseId }));
    },
    async deliveryStatusByCourse(dayOfWeek, today) {
        const [schedules, records, courses] = await Promise.all([
            prisma_1.default.deliverySchedule.findMany({
                where: { dayOfWeek, isActive: true },
                include: { customer: { select: { id: true, deliveryCourseId: true } } },
            }),
            prisma_1.default.deliveryRecord.findMany({
                where: { deliveryDate: { gte: startOfDay(today), lte: endOfDay(today) }, status: 'completed' },
                select: { customerId: true },
            }),
            prisma_1.default.deliveryCourse.findMany(),
        ]);
        const completedSet = new Set(records.map((r) => r.customerId));
        const courseMap = new Map();
        for (const c of courses) {
            courseMap.set(c.id, { courseId: c.id, courseName: c.name, total: 0, completed: 0, pending: 0 });
        }
        for (const s of schedules) {
            const courseId = s.customer.deliveryCourseId ?? 0;
            if (!courseMap.has(courseId)) {
                courseMap.set(courseId, { courseId, courseName: courseId === 0 ? '未設定' : String(courseId), total: 0, completed: 0, pending: 0 });
            }
            const entry = courseMap.get(courseId);
            entry.total += 1;
            if (completedSet.has(s.customerId))
                entry.completed += 1;
            else
                entry.pending += 1;
        }
        return Array.from(courseMap.values());
    },
    async monthlySummary(now) {
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const orders = await prisma_1.default.order.findMany({ where: { orderDate: { gte: start, lte: end } } });
        const totalSales = orders.reduce((a, o) => a + o.totalPrice, 0);
        return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, totalSales };
    },
};
