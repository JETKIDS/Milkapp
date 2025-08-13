"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Dashboard API', () => {
    it('should return today count, pending deliveries, monthly summary and delivery status', async () => {
        // seed: create course, customers and schedules for today weekday
        const day = new Date().getUTCDay();
        const course = await (0, supertest_1.default)(app_1.default).post('/api/delivery-courses').send({ name: 'Eコース' });
        const courseId = course.body.data.id;
        const c1 = await (0, supertest_1.default)(app_1.default).post('/api/customers').send({ name: '阿部', address: '仙台市1-1-1', deliveryCourseId: courseId });
        const c2 = await (0, supertest_1.default)(app_1.default).post('/api/customers').send({ name: '大野', address: '盛岡市1-1-1', deliveryCourseId: courseId });
        await (0, supertest_1.default)(app_1.default).post('/api/schedules').send({ customerId: c1.body.data.id, dayOfWeek: day });
        await (0, supertest_1.default)(app_1.default).post('/api/schedules').send({ customerId: c2.body.data.id, dayOfWeek: day });
        const today = await (0, supertest_1.default)(app_1.default).get('/api/dashboard/today');
        expect(today.status).toBe(200);
        expect(typeof today.body.data.deliveryCount).toBe('number');
        const pending = await (0, supertest_1.default)(app_1.default).get('/api/dashboard/pending-deliveries');
        expect(pending.status).toBe(200);
        expect(Array.isArray(pending.body.data)).toBe(true);
        const status = await (0, supertest_1.default)(app_1.default).get('/api/dashboard/delivery-status');
        expect(status.status).toBe(200);
        expect(Array.isArray(status.body.data)).toBe(true);
        const monthly = await (0, supertest_1.default)(app_1.default).get('/api/dashboard/monthly-summary');
        expect(monthly.status).toBe(200);
        expect(typeof monthly.body.data.totalSales).toBe('number');
    });
});
