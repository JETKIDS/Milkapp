import request from 'supertest';
import app from '../src/app';

describe('Schedules API', () => {
  it('should create schedules, query by day and by course, and complete a schedule', async () => {
    // prepare a course and a customer
    const course = await request(app).post('/api/delivery-courses').send({ name: 'Bコース' });
    const courseId = course.body.data.id as number;
    const customer = await request(app).post('/api/customers').send({ name: '鈴木', address: '名古屋市1-1-1', deliveryCourseId: courseId });
    const customerId = customer.body.data.id as number;

    // create schedule for Monday (1)
    const sch = await request(app).post('/api/schedules').send({ customerId, dayOfWeek: 1 });
    expect(sch.status).toBe(201);
    const scheduleId = sch.body.data.id as number;

    // by day
    const byDay = await request(app).get('/api/schedules/by-day/1');
    expect(byDay.status).toBe(200);
    expect(Array.isArray(byDay.body.data)).toBe(true);

    // by course
    const byCourse = await request(app).get(`/api/schedules/by-course/${courseId}`);
    expect(byCourse.status).toBe(200);
    expect(Array.isArray(byCourse.body.data)).toBe(true);

    // complete schedule (today)
    const comp = await request(app).post(`/api/schedules/complete/${scheduleId}`).send({ date: new Date().toISOString() });
    expect(comp.status).toBe(201);
    expect(comp.body.data.status).toBe('completed');
  });

  it('should return delivery history by customer', async () => {
    const customer = await request(app).post('/api/customers').send({ name: '履歴', address: 'H' });
    const customerId = customer.body.data.id as number;
    const sch = await request(app).post('/api/schedules').send({ customerId, dayOfWeek: 1 });
    const scheduleId = sch.body.data.id as number;
    await request(app).post(`/api/schedules/complete/${scheduleId}`).send({ date: new Date().toISOString() });

    const res = await request(app).get(`/api/schedules/history/by-customer/${customerId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});


