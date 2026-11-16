import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();

const snap = async (page, name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${name}.png` });
};

const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await desktop.newPage();
await p.goto('http://127.0.0.1:3000/?s=desktop', { waitUntil: 'networkidle' });
await p.waitForTimeout(4500);
await snap(p, '01-desktop-hero');

await p.locator('#menu').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await snap(p, '02-desktop-menu');

await p.getByRole('button', { name: 'Xem Cà phê sữa đá' }).click();
await p.waitForTimeout(700);
await snap(p, '03-desktop-modal');
await p.getByRole('button', { name: 'Thêm vào giỏ' }).click();
await p.getByRole('button', { name: 'Thêm Trà đào cam sả vào giỏ' }).click();
await p.getByRole('button', { name: 'Thêm Cold Brew vào giỏ' }).click();

await p.locator('#story').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await snap(p, '04-desktop-story');

await p.locator('#cart').scrollIntoViewIfNeeded();
await p.waitForTimeout(900);
await snap(p, '05-desktop-cart');

await p.locator('#voices').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await snap(p, '06-desktop-voices');

await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(700);
await snap(p, '07-desktop-footer');

await p.getByRole('button', { name: 'Thanh toán mô phỏng' }).click();
await p.waitForTimeout(800);
await snap(p, '08-desktop-auth');
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const m = await mobile.newPage();
await m.goto('http://127.0.0.1:3000/?s=mobile', { waitUntil: 'networkidle' });
await m.waitForTimeout(4500);
await snap(m, '11-mobile-hero');
await m.locator('#menu').scrollIntoViewIfNeeded();
await m.waitForTimeout(1000);
await snap(m, '12-mobile-menu');
await m.getByRole('button', { name: 'Xem Cà phê sữa đá' }).click();
await m.waitForTimeout(700);
await snap(m, '13-mobile-modal');
await m.getByLabel('Kích cỡ').selectOption('LARGE');
await m.getByRole('button', { name: 'Thêm vào giỏ' }).click();
await m.locator('#cart').scrollIntoViewIfNeeded();
await m.waitForTimeout(900);
await snap(m, '14-mobile-cart');
await m.getByRole('button', { name: 'Thanh toán mô phỏng' }).click();
await m.waitForTimeout(800);
await snap(m, '15-mobile-auth');
await mobile.close();

await browser.close();
console.log('done');
