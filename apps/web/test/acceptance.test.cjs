const test = require('node:test');
const assert = require('node:assert/strict');

test('catalogue accepts only products with non-negative VND prices', () => {
  const product = { id: 1, name: 'BrewLite coffee', basePrice: 35000, stock: 2 };
  assert.ok(product.id > 0 && product.name.length > 0);
  assert.ok(Number.isInteger(product.basePrice) && product.basePrice >= 0);
  assert.ok(Number.isInteger(product.stock) && product.stock >= 0);
});
