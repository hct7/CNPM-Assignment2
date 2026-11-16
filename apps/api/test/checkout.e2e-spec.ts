import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/module';
import { runMigrations } from '../src/migrate';
import { signToken } from '../src/auth';

describe('BrewLite HTTP integration: menu → checkout → order state', () => {
  let app: INestApplication;
  let db: Pool;
  let productId: number;
  const http = () => request(app.getHttpServer());

  async function register() {
    const email = `test-${Date.now()}-${Math.random().toString(16).slice(2)}@brewlite.test`;
    const response = await http().post('/auth/register').send({ name: 'Integration Tester', email, password: 'secure-test-pass-123' });
    expect(response.status).toBe(201);
    return response.body.accessToken as string;
  }

  async function createOrder(token: string, key: string, quantity = 1) {
    return http().post('/orders').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', key)
      .send({ items: [{ productId, quantity, size: 'MEDIUM', toppings: ['PEARL'] }] });
  }

  beforeAll(async () => {
    process.env.DATABASE_URL ||= 'postgresql://brewlite:local_dev_only_change_me@localhost:5432/brewlite';
    process.env.JWT_SECRET = 'integration-test-jwt-secret-at-least-32-characters';
    process.env.PAYMENT_MOCK_MODE = 'success';
    await runMigrations();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    db = app.get<Pool>('PG_POOL');
    const product = await db.query("SELECT id FROM products WHERE name='Cà phê sữa đá'");
    productId = product.rows[0].id;
  });

  beforeEach(async () => {
    await db.query('TRUNCATE payments, order_items, orders, users RESTART IDENTITY CASCADE');
    await db.query("UPDATE products SET stock=CASE name WHEN 'Cà phê sữa đá' THEN 40 WHEN 'Bạc xỉu' THEN 35 WHEN 'Trà đào cam sả' THEN 30 ELSE 20 END");
    process.env.PAYMENT_MOCK_MODE = 'success';
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists menu, creates idempotent order, pays, and advances allowed states', async () => {
    const menu = await http().get('/products').expect(200);
    expect(menu.body).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Cà phê sữa đá', basePrice: 35000 })]));
    const token = await register();
    const created = await createOrder(token, 'order-key-1');
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('PENDING');
    expect(created.body.total).toBe(Math.round(35000 * 1.1) + 6000);
    expect(created.body.items[0].toppings).toEqual(['PEARL']);

    const replay = await createOrder(token, 'order-key-1');
    expect(replay.status).toBe(201);
    expect(replay.body.replayed).toBe(true);
    const changedPayload = await http().post('/orders').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'order-key-1')
      .send({ items: [{ productId, quantity: 2, size: 'MEDIUM', toppings: ['PEARL'] }] });
    expect(changedPayload.status).toBe(409);

    const paid = await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'payment-key-1').send({ method: 'WALLET' });
    expect(paid.status).toBe(201);
    expect(paid.body).toMatchObject({ status: 'SUCCESS', orderStatus: 'PAID' });
    const paymentReplay = await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'payment-key-1').send({ method: 'WALLET' });
    expect(paymentReplay.body.replayed).toBe(true);

    const staffToken = signToken({ id: '00000000-0000-4000-8000-000000000001', role: 'STAFF' });
    await http().patch(`/orders/${created.body.id}/status`).set('Authorization', `Bearer ${staffToken}`).send({ status: 'PREPARING' }).expect(200);
    await http().patch(`/orders/${created.body.id}/status`).set('Authorization', `Bearer ${staffToken}`).send({ status: 'COMPLETED' }).expect(409);
    const history = await http().get('/orders/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(history.body[0]).toMatchObject({ id: created.body.id, status: 'PREPARING' });
  });

  it('restores stock after failure and reserves it again for an idempotent retry', async () => {
    const token = await register();
    const created = await createOrder(token, 'order-retry-1', 2).expect(201);
    const before = await db.query('SELECT stock FROM products WHERE id=$1', [productId]);
    expect(before.rows[0].stock).toBe(38);
    process.env.PAYMENT_MOCK_MODE = 'fail';
    const failed = await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'payment-fail-1').send({ method: 'CARD' }).expect(201);
    expect(failed.body).toMatchObject({ status: 'FAILED', orderStatus: 'PAYMENT_FAILED' });
    expect((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock).toBe(40);
    process.env.PAYMENT_MOCK_MODE = 'success';
    const retried = await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'payment-retry-1').send({ method: 'WALLET' }).expect(201);
    expect(retried.body.orderStatus).toBe('PAID');
    expect((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock).toBe(38);
  });

  it('serializes concurrent purchases so inventory cannot go below zero', async () => {
    const tokenOne = await register();
    const tokenTwo = await register();
    const results = await Promise.all([createOrder(tokenOne, 'race-a', 30), createOrder(tokenTwo, 'race-b', 30)]);
    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(Number((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock)).toBe(10);
  });

  it('applies a database promo, awards loyalty points once, and exposes admin order controls', async () => {
    const token = await register();
    const managerToken = signToken({ id: '00000000-0000-4000-8000-000000000002', role: 'MANAGER' });
    const validation = await http().post('/promotions/validate').send({ code: 'welcome10', subtotal: 44500 }).expect(201);
    expect(validation.body).toMatchObject({ code: 'WELCOME10', discountAmount: 4450, total: 40050 });

    const created = await http().post('/orders').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'promo-order-1')
      .send({ items: [{ productId, quantity: 1, size: 'MEDIUM', toppings: ['PEARL'] }], promoCode: 'WELCOME10' }).expect(201);
    expect(created.body).toMatchObject({ subtotal: 44500, discountAmount: 4450, promoCode: 'WELCOME10', total: 40050 });
    await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'promo-payment-1')
      .send({ method: 'WALLET' }).expect(201).expect(({ body }) => expect(body.loyaltyPointsAwarded).toBe(4));

    const replay = await http().post(`/orders/${created.body.id}/pay`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'promo-payment-1')
      .send({ method: 'WALLET' }).expect(201);
    expect(replay.body.replayed).toBe(true);
    expect((await http().get('/loyalty/me').set('Authorization', `Bearer ${token}`).expect(200)).body.points).toBe(4);

    await http().get('/admin/orders?status=PAID').set('Authorization', `Bearer ${managerToken}`).expect(200).expect(({ body }) => {
      expect(body[0]).toMatchObject({ id: created.body.id, customerEmail: expect.stringContaining('@'), promoCode: 'WELCOME10' });
    });
    await http().patch(`/orders/${created.body.id}/status`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'PREPARING' }).expect(200);
    const promoCode = `STAFF${Date.now()}`;
    const managedPromotion = await http().post('/admin/promotions').set('Authorization', `Bearer ${managerToken}`).send({
      code: promoCode, discountType: 'PERCENT', discountValue: 15, minOrderAmount: 50000, maxDiscount: 12000,
    }).expect(201);
    expect(managedPromotion.body).toMatchObject({ code: promoCode, discountValue: 15, active: true });
    await http().patch(`/admin/promotions/${managedPromotion.body.id}`).set('Authorization', `Bearer ${managerToken}`).send({ active: false }).expect(200);
    await http().get('/admin/orders').set('Authorization', `Bearer ${token}`).expect(403);
  });
});
