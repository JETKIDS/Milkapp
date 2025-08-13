import request from 'supertest';
import app from '../src/app';

describe('Reports API', () => {
  it('should return PDFs for delivery list, product list, and invoice, and record invoice history', async () => {
    // seed basic data
    const course = await request(app).post('/api/delivery-courses').send({ name: 'Cコース' });
    const courseId = course.body.data.id as number;
    await request(app).post('/api/customers').send({ name: '山本', address: '福岡市1-1-1', deliveryCourseId: courseId });
    const m = await request(app).post('/api/manufacturers').send({ name: '森永' });
    const manufacturerId = m.body.data.id as number;
    await request(app).post('/api/products').send({ name: '特濃牛乳', manufacturerId, price: 220, unit: '本' });

    // delivery list PDF
    const dl = await request(app).post('/api/reports/delivery-list').send({ courseId });
    expect(dl.status).toBe(200);
    expect(dl.headers['content-type']).toContain('application/pdf');
    expect(Number(dl.headers['content-length'])).toBeGreaterThan(0);

    // product list PDF
    const pl = await request(app).post('/api/reports/product-list').send({});
    expect(pl.status).toBe(200);
    expect(pl.headers['content-type']).toContain('application/pdf');

    // invoice PDF + history
    const customer = await request(app).post('/api/customers').send({ name: '中村', address: '広島市1-1-1' });
    const customerId = customer.body.data.id as number;
    // 期間に注文を1件入れる
    const product = await request(app).post('/api/products').send({ name: '低脂肪', manufacturerId, price: 180, unit: '本' });
    const productId = product.body.data.id as number;
    await request(app).post('/api/orders').send({ customerId, productId, quantity: 2, unitPrice: 180, orderDate: new Date().toISOString() });

    const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const end = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const inv = await request(app).post(`/api/reports/invoice/${customerId}`).send({ startDate: start, endDate: end });
    expect(inv.status).toBe(200);
    expect(inv.headers['content-type']).toContain('application/pdf');

    const history = await request(app).get(`/api/reports/invoice-history/${customerId}`);
    expect(history.status).toBe(200);
    expect(Array.isArray(history.body.data)).toBe(true);
    expect(history.body.data.length).toBeGreaterThan(0);
  });
});


