"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulesRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.schedulesRepository = {
    async list() {
        return prisma_1.default.deliverySchedule.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { customerId: 'asc' }] });
    },
    async listByDay(dayOfWeek) {
        return prisma_1.default.deliverySchedule.findMany({ where: { dayOfWeek }, orderBy: { customerId: 'asc' } });
    },
    async listByCourse(courseId) {
        return prisma_1.default.deliverySchedule.findMany({
            where: { customer: { deliveryCourseId: courseId } },
            orderBy: [{ dayOfWeek: 'asc' }, { customerId: 'asc' }],
            include: { customer: true },
        });
    },
    async create(input) {
        return prisma_1.default.deliverySchedule.create({ data: { ...input, isActive: input.isActive ?? true } });
    },
    async update(id, input) {
        return prisma_1.default.deliverySchedule.update({ where: { id }, data: input });
    },
    async complete(scheduleId, dateISO) {
        const schedule = await prisma_1.default.deliverySchedule.findUnique({ where: { id: scheduleId } });
        if (!schedule)
            throw new Error('SCHEDULE_NOT_FOUND');
        return prisma_1.default.deliveryRecord.create({
            data: {
                customerId: schedule.customerId,
                deliveryDate: new Date(dateISO),
                status: 'completed',
            },
        });
    },
};
