import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Đơn hàng' }).click();
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible();
  await expect(page.locator('#orders')).toContainText('PAID');
});
