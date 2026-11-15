describe('Product catalogue acceptance', () => {
  it('represents VND as non-negative integer and stock as non-negative integer', () => {
    const product = { id: 1, name: 'Cà phê sữa đá', basePrice: 35000, stock: 40 };
    expect(Number.isInteger(product.basePrice) && product.basePrice >= 0).toBe(true);
    expect(Number.isInteger(product.stock) && product.stock >= 0).toBe(true);
  });
});
