import request from 'supertest';
import app from '../src/app';

describe('Dashboard API', () => {
  it('should return today count, pending deliveries, monthly summary and delivery status', async () => {
    // seed: create course, customers and schedules for today weekday
    const day = new Date().getUTCDay();
    const course = await request(app).post('/api/delivery-courses').send({ name: 'Eコース' });
    const courseId = course.body.data.id as number;
    const c1 = await request(app).post('/api/customers').send({ name: '阿部', address: '仙台市1-1-1', deliveryCourseId: courseId });
    const c2 = await request(app).post('/api/customers').send({ name: '大野', address: '盛岡市1-1-1', deliveryCourseId: courseId });
    await request(app).post('/api/schedules').send({ customerId: c1.body.data.id, dayOfWeek: day });
    await request(app).post('/api/schedules').send({ customerId: c2.body.data.id, dayOfWeek: day });

    const today = await request(app).get('/api/dashboard/today');
    expect(today.status).toBe(200);
    expect(typeof today.body.data.deliveryCount).toBe('number');

    const pending = await request(app).get('/api/dashboard/pending-deliveries');
    expect(pending.status).toBe(200);
    expect(Array.isArray(pending.body.data)).toBe(true);

    const status = await request(app).get('/api/dashboard/delivery-status');
    expect(status.status).toBe(200);
    expect(Array.isArray(status.body.data)).toBe(true);

    const monthly = await request(app).get('/api/dashboard/monthly-summary');
    expect(monthly.status).toBe(200);
    expect(typeof monthly.body.data.totalSales).toBe('number');
  });
});


