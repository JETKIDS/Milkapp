"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Customer Detail API', () => {
    it('should return customer detail, schedules, monthly calendar/billing, and manage course position', async () => {
        // seed course and customer
        const course = await (0, supertest_1.default)(app_1.default).post('/api/delivery-courses').send({ name: 'Dコース' });
        const courseId = course.body.data.id;
        const customer = await (0, supertest_1.default)(app_1.default).post('/api/customers').send({ name: '石田', address: '神戸市1-1-1', deliveryCourseId: courseId });
        const customerId = customer.body.data.id;
        // schedule
        await (0, supertest_1.default)(app_1.default).post('/api/schedules').send({ customerId, dayOfWeek: 2 });
        // contract+pattern
        const m = await (0, supertest_1.default)(app_1.default).post('/api/manufacturers').send({ name: '協同乳業' });
        const manufacturerId = m.body.data.id;
        const p = await (0, supertest_1.default)(app_1.default).post('/api/products').send({ name: 'のむヨーグルト', manufacturerId, price: 200, unit: '本' });
        const productId = p.body.data.id;
        const cc = await (0, supertest_1.default)(app_1.default).post(`/api/customers/${customerId}/contracts`).send({ productId, startDate: new Date().toISOString() });
        const contractId = cc.body.data.id;
        await (0, supertest_1.default)(app_1.default).post(`/api/customers/${customerId}/delivery-patterns`).send({ contractId, dayOfWeek: 2, quantity: 1 });
        // detail
        const detail = await (0, supertest_1.default)(app_1.default).get(`/api/customers/${customerId}/detail`);
        expect(detail.status).toBe(200);
        expect(detail.body.data.customer.name).toBe('石田');
        // delivery schedule
        const sched = await (0, supertest_1.default)(app_1.default).get(`/api/customers/${customerId}/delivery-schedule`);
        expect(sched.status).toBe(200);
        expect(Array.isArray(sched.body.data)).toBe(true);
        // monthly calendar
        const now = new Date();
        const cal = await (0, supertest_1.default)(app_1.default).get(`/api/customers/${customerId}/monthly-calendar/${now.getUTCFullYear()}/${now.getUTCMonth() + 1}`);
        expect(cal.status).toBe(200);
        expect(cal.body.data.month).toBe(now.getUTCMonth() + 1);
        // monthly billing
        const bill = await (0, supertest_1.default)(app_1.default).get(`/api/customers/${customerId}/monthly-billing/${now.getUTCFullYear()}/${now.getUTCMonth() + 1}`);
        expect(bill.status).toBe(200);
        expect(typeof bill.body.data.total).toBe('number');
        // course position set/get
        const setPos = await (0, supertest_1.default)(app_1.default).put(`/api/customers/${customerId}/course-position`).send({ courseId, position: 5 });
        expect(setPos.status).toBe(200);
        const getPos = await (0, supertest_1.default)(app_1.default).get(`/api/customers/${customerId}/course-position`);
        expect(getPos.status).toBe(200);
        expect(getPos.body.data[0].position).toBe(5);
    });
});
