const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateUnitPrice, calculateCartTotal } = require('../lib/cart-utils.mjs');

test('calculates size and topping prices in VND using the same rule as the UI', () => {
  assert.equal(calculateUnitPrice(35000, 'SMALL'), 35000);
  assert.equal(calculateUnitPrice(35000, 'MEDIUM'), 38500);
  assert.equal(calculateUnitPrice(35000, 'LARGE', ['PEARL', 'CREAM']), 55750);
});

test('recalculates cart total after quantity, size, or topping changes', () => {
  const products = [
    { id: 1, basePrice: 35000 },
    { id: 2, basePrice: 45000 },
  ];
  const cart = { 1: 2, 2: 1 };
  const sizes = { 1: 'MEDIUM', 2: 'SMALL' };
  const toppings = { 1: ['PEARL'], 2: [] };
  assert.equal(calculateCartTotal(products, cart, sizes, toppings), (38500 + 6000) * 2 + 45000);
  assert.equal(calculateCartTotal(products, { 1: 1, 2: 1 }, sizes, toppings), (38500 + 6000) + 45000);
});
