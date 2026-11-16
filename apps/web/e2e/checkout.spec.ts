import { expect, request, test } from '@playwright/test';

test('customer orders a customized drink and sees its paid confirmation and history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Menu hôm nay' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cà phê sữa đá' })).toBeVisible();

  await page.getByRole('button', { name: 'Xem Cà phê sữa đá' }).click();
  await page.getByLabel('Kích cỡ').selectOption('LARGE');
  await page.getByLabel(/Trân châu/).check();
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await expect(page.getByText(/Cà phê sữa đá · LARGE/)).toBeVisible();
  await page.getByLabel('Mã khuyến mãi').fill('WELCOME10');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('status')).toContainText('Đã áp dụng WELCOME10');

  await page.getByRole('button', { name: 'Thanh toán mô phỏng' }).click();
  await page.getByRole('button', { name: /Chưa có tài khoản\? Đăng ký/ }).click();
  const email = `customer-${Date.now()}@brewlite.test`;
  await page.getByLabel('Tên hiển thị').fill('BrewLite Customer');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill('test-password-123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();

  await page.getByRole('button', { name: 'Thanh toán mô phỏng' }).click();
  await expect(page.getByRole('status')).toContainText('Đặt hàng thành công', { timeout: 15_000 });
  await expect(page.getByRole('status')).toContainText('PAID');
  await expect(page.getByRole('status')).toContainText('WELCOME10');
  await expect(page.getByRole('status')).toContainText('điểm');
  await page.getByRole('button', { name: 'Đơn hàng' }).click();
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible();
  await expect(page.locator('#orders')).toContainText('PAID');
});

test('manager reviews the live order queue and creates a promotion', async ({ page }) => {
  const api = await request.newContext({ baseURL: 'http://127.0.0.1:3001' });
  const email = `admin-queue-${Date.now()}@brewlite.test`;
  try {
    const registered = await api.post('/auth/register', { data: { name: 'Queue Tester', email, password: 'test-password-123' } });
    const { accessToken } = await registered.json();
    const products = await (await api.get('/products')).json();
    const orderResponse = await api.post('/orders', {
      headers: { Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': `queue-${Date.now()}` },
      data: { items: [{ productId: products[0].id, quantity: 1, size: 'MEDIUM', toppings: [] }] },
    });
    const order = await orderResponse.json();
    await api.post(`/orders/${order.id}/pay`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': `queue-pay-${Date.now()}` },
      data: { method: 'WALLET' },
    });
  } finally { await api.dispose(); }

  await page.goto('/admin');
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL || 'admin@brewlite.local');
  await page.getByLabel('Mật khẩu').fill(process.env.ADMIN_PASSWORD || 'LocalOnly-BrewLite-ChangeMe!2026');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản trị cửa hàng' })).toBeVisible();
  const orderCard = page.locator('article').filter({ hasText: email });
  await expect(orderCard).toContainText('Chờ pha chế');
  await orderCard.getByRole('button', { name: 'Bắt đầu pha' }).click();
  await expect(orderCard).toContainText('Đang pha chế');

  await page.getByRole('button', { name: 'Khuyến mãi' }).click();
  const code = `E2E${Date.now()}`;
  await page.getByLabel('Mã', { exact: true }).fill(code);
  await page.getByLabel('Giá trị', { exact: true }).fill('12');
  await page.getByLabel('Đơn tối thiểu (đ)').fill('30000');
  await page.getByRole('button', { name: 'Tạo mã' }).click();
  await expect(page.getByText(code)).toBeVisible();
});
