import request from 'supertest';
import app from '../src/app';

describe('Orders API', () => {
  it('should create product+customer then order and update', async () => {
    const m = await request(app).post('/api/manufacturers').send({ name: '雪印' });
    const manufacturerId = m.body.data.id as number;
    const p = await request(app).post('/api/products').send({ name: '牛乳500ml', manufacturerId, price: 180, unit: '本' });
    const c = await request(app).post('/api/customers').send({ name: '佐藤', address: '大阪府大阪市1-1-1' });
    const productId = p.body.data.id as number;
    const customerId = c.body.data.id as number;

    const o = await request(app)
      .post('/api/orders')
      .send({ customerId, productId, quantity: 2, unitPrice: 180, orderDate: new Date().toISOString() });
    expect(o.status).toBe(201);
    const orderId = o.body.data.id as number;

    const u = await request(app).put(`/api/orders/${orderId}`).send({ status: 'completed' });
    expect(u.status).toBe(200);
    expect(u.body.data.status).toBe('completed');
  });

  it('should reject order when quantity exceeds stock', async () => {
    const man = await request(app).post('/api/manufacturers').send({ name: 'StockMan' });
    const manufacturerId = man.body.data.id as number;

    const prod = await request(app)
      .post('/api/products')
      .send({ name: 'Limited', manufacturerId, price: 100, unit: 'btl' });
    const productId = prod.body.data.id as number;

    // 製品の在庫を1に調整
    // 直接DB更新は避け、PUTが無いので最初のstockデフォルトは高いため、在庫消費テストを先に行う
    // ここではエラー検証のため、超過数量でリクエスト

    const cust = await request(app).post('/api/customers').send({ name: 'Stock Test', address: 'X' });
    const customerId = cust.body.data.id as number;

    // まず在庫を消費するための注文（大量在庫があるため成立）
    await request(app)
      .post('/api/orders')
      .send({ customerId, productId, quantity: 1, unitPrice: 100, orderDate: new Date().toISOString() });

    // ここで在庫は99998相当のため本来エラーしないが、要件テストのために明示在庫不足ケースも別途検証すべき
    // 実在庫管理を正しく検証するには、Productにstockを外から設定できるAPIが必要
    // 暫定として、超過数量を非常に大きくしてエラーにする
    const res = await request(app)
      .post('/api/orders')
      .send({ customerId, productId, quantity: 99999999, unitPrice: 100, orderDate: new Date().toISOString() });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('should get order history by customer and period', async () => {
    const m = await request(app).post('/api/manufacturers').send({ name: '履歴メーカ' });
    const manufacturerId = m.body.data.id as number;
    const p = await request(app).post('/api/products').send({ name: '履歴商品', manufacturerId, price: 120, unit: '本' });
    const c = await request(app).post('/api/customers').send({ name: '履歴顧客', address: 'Z' });
    const productId = p.body.data.id as number;
    const customerId = c.body.data.id as number;

    const today = new Date();
    const iso = today.toISOString();
    await request(app).post('/api/orders').send({ customerId, productId, quantity: 1, unitPrice: 120, orderDate: iso });

    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const res = await request(app).get(`/api/orders/by-customer/${customerId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});


