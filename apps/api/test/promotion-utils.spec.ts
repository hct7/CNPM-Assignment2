import { calculatePromotionDiscount } from '../src/promotion-utils';

describe('promotion discount calculation', () => {
  it('applies a percentage discount and respects the maximum cap', () => {
    expect(calculatePromotionDiscount({ id: 1, code: 'SAVE10', discountType: 'PERCENT', discountValue: 10, minOrderAmount: 0, maxDiscount: 15000 }, 200000)).toBe(15000);
  });

  it('applies a fixed discount without reducing the order below zero', () => {
    expect(calculatePromotionDiscount({ id: 2, code: 'SAVE50', discountType: 'FIXED', discountValue: 50000, minOrderAmount: 0, maxDiscount: null }, 30000)).toBe(30000);
  });
});
