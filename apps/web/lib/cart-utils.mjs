export const TOPPING_OPTIONS = Object.freeze([
  Object.freeze({ id: 'EXTRA_SHOT', name: 'Shot thêm', price: 8000 }),
  Object.freeze({ id: 'PEARL', name: 'Trân châu', price: 6000 }),
  Object.freeze({ id: 'CREAM', name: 'Kem cheese', price: 6000 }),
]);

export function calculateUnitPrice(basePrice, size, toppings = []) {
  const multiplier = size === 'LARGE' ? 1.25 : size === 'MEDIUM' ? 1.1 : 1;
  const toppingTotal = TOPPING_OPTIONS.filter((option) => toppings.includes(option.id))
    .reduce((sum, option) => sum + option.price, 0);
  return Math.round(basePrice * multiplier) + toppingTotal;
}

export function calculateCartTotal(products, cart, sizes = {}, toppings = {}) {
  return products.reduce((total, product) => total + calculateUnitPrice(
    product.basePrice,
    sizes[product.id] || 'MEDIUM',
    toppings[product.id] || [],
  ) * (cart[product.id] || 0), 0);
}
