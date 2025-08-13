"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Customers API', () => {
    it('CRUD flow: create -> list -> update -> delete', async () => {
        // create
        const createRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/customers')
            .send({ name: '田中太郎', address: '東京都千代田区1-1-1', email: 'taro@example.com' });
        expect(createRes.status).toBe(201);
        const created = createRes.body.data;
        // list
        const listRes = await (0, supertest_1.default)(app_1.default).get('/api/customers');
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body.data)).toBe(true);
        // update
        const updateRes = await (0, supertest_1.default)(app_1.default)
            .put(`/api/customers/${created.id}`)
            .send({ phone: '03-1234-5678' });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.phone).toBe('03-1234-5678');
        // delete
        const delRes = await (0, supertest_1.default)(app_1.default).delete(`/api/customers/${created.id}`);
        expect(delRes.status).toBe(204);
    });
});
