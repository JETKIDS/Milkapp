import request from 'supertest';
import app from '../src/app';

describe('Manufacturers / Products / DeliveryCourses', () => {
  it('should create and list manufacturer, product, and delivery course; enforce delete constraints', async () => {
    // create manufacturer
    const m = await request(app).post('/api/manufacturers').send({ name: '明治', contactInfo: '03-xxxx-xxxx' });
    expect(m.status).toBe(201);
    const manufacturerId = m.body.data.id as number;

    // create product under manufacturer
    const p = await request(app)
      .post('/api/products')
      .send({ name: '牛乳200ml', manufacturerId, price: 120, unit: '本' });
    expect(p.status).toBe(201);
    const productId = p.body.data.id as number;

    // list endpoints
    expect((await request(app).get('/api/manufacturers')).status).toBe(200);
    expect((await request(app).get('/api/products')).status).toBe(200);
    expect((await request(app).post('/api/delivery-courses').send({ name: 'Aコース' })).status).toBe(201);
    expect((await request(app).get('/api/delivery-courses')).status).toBe(200);

    // delete manufacturer should fail due to related product
    const delM = await request(app).delete(`/api/manufacturers/${manufacturerId}`);
    expect(delM.status).toBe(409);
    expect(delM.body.success).toBe(false);

    // delete product then delete manufacturer
    expect((await request(app).delete(`/api/products/${productId}`)).status).toBe(204);
    expect((await request(app).delete(`/api/manufacturers/${manufacturerId}`)).status).toBe(204);
  });
});


