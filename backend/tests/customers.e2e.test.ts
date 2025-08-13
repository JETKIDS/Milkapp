import request from 'supertest';
import app from '../src/app';

describe('Customers API', () => {
  it('CRUD flow: create -> list -> update -> delete', async () => {
    // create
    const createRes = await request(app)
      .post('/api/customers')
      .send({ name: '田中太郎', address: '東京都千代田区1-1-1', email: 'taro@example.com' });
    expect(createRes.status).toBe(201);
    const created = createRes.body.data as { id: number };

    // list
    const listRes = await request(app).get('/api/customers');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // update
    const updateRes = await request(app)
      .put(`/api/customers/${created.id}`)
      .send({ phone: '03-1234-5678' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.phone).toBe('03-1234-5678');

    // delete
    const delRes = await request(app).delete(`/api/customers/${created.id}`);
    expect(delRes.status).toBe(204);
  });
});


