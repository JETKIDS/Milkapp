import request from 'supertest';
import app from '../src/app';

describe('Customer Contracts & Delivery Patterns', () => {
  it('should create contract and patterns, update them, and list by customer', async () => {
    // prerequisites: product and customer
    const m = await request(app).post('/api/manufacturers').send({ name: '大内' });
    const manufacturerId = m.body.data.id as number;
    const p = await request(app).post('/api/products').send({ name: 'コーヒー牛乳', manufacturerId, price: 160, unit: '本' });
    const c = await request(app).post('/api/customers').send({ name: '高橋', address: '札幌市1-1-1' });
    const productId = p.body.data.id as number;
    const customerId = c.body.data.id as number;

    // create contract
    const cc = await request(app)
      .post(`/api/customers/${customerId}/contracts`)
      .send({ productId, startDate: new Date().toISOString(), isActive: true });
    expect(cc.status).toBe(201);
    const contractId = cc.body.data.id as number;

    // create patterns
    const pat1 = await request(app).post(`/api/customers/${customerId}/delivery-patterns`).send({ contractId, dayOfWeek: 1, quantity: 2 });
    const pat2 = await request(app).post(`/api/customers/${customerId}/delivery-patterns`).send({ contractId, dayOfWeek: 3, quantity: 1 });
    expect(pat1.status).toBe(201);
    expect(pat2.status).toBe(201);

    // list contracts
    const list = await request(app).get(`/api/customers/${customerId}/contracts`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    // update pattern
    const patId = pat1.body.data.id as number;
    const upd = await request(app).put(`/api/customers/${customerId}/delivery-patterns/${patId}`).send({ quantity: 3 });
    expect(upd.status).toBe(200);
    expect(upd.body.data.quantity).toBe(3);

    // cleanup: delete pattern and contract
    expect((await request(app).delete(`/api/customers/${customerId}/delivery-patterns/${patId}`)).status).toBe(204);
    expect((await request(app).delete(`/api/customers/${customerId}/contracts/${contractId}`)).status).toBe(204);
  });
});


