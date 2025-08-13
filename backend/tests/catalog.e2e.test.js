"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Manufacturers / Products / DeliveryCourses', () => {
    it('should create and list manufacturer, product, and delivery course; enforce delete constraints', async () => {
        // create manufacturer
        const m = await (0, supertest_1.default)(app_1.default).post('/api/manufacturers').send({ name: '明治', contactInfo: '03-xxxx-xxxx' });
        expect(m.status).toBe(201);
        const manufacturerId = m.body.data.id;
        // create product under manufacturer
        const p = await (0, supertest_1.default)(app_1.default)
            .post('/api/products')
            .send({ name: '牛乳200ml', manufacturerId, price: 120, unit: '本' });
        expect(p.status).toBe(201);
        const productId = p.body.data.id;
        // list endpoints
        expect((await (0, supertest_1.default)(app_1.default).get('/api/manufacturers')).status).toBe(200);
        expect((await (0, supertest_1.default)(app_1.default).get('/api/products')).status).toBe(200);
        expect((await (0, supertest_1.default)(app_1.default).post('/api/delivery-courses').send({ name: 'Aコース' })).status).toBe(201);
        expect((await (0, supertest_1.default)(app_1.default).get('/api/delivery-courses')).status).toBe(200);
        // delete manufacturer should fail due to related product
        const delM = await (0, supertest_1.default)(app_1.default).delete(`/api/manufacturers/${manufacturerId}`);
        expect(delM.status).toBe(409);
        expect(delM.body.success).toBe(false);
        // delete product then delete manufacturer
        expect((await (0, supertest_1.default)(app_1.default).delete(`/api/products/${productId}`)).status).toBe(204);
        expect((await (0, supertest_1.default)(app_1.default).delete(`/api/manufacturers/${manufacturerId}`)).status).toBe(204);
    });
});
