import { canTransition } from '../src/order-state';

describe('Order State Machine', () => {
  it('accepts the successful order path', () => {
    expect(canTransition('PENDING', 'PAID')).toBe(true);
    expect(canTransition('PAID', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'READY')).toBe(true);
    expect(canTransition('READY', 'COMPLETED')).toBe(true);
  });

  it('rejects skipping states and transitions from terminal states', () => {
    expect(canTransition('PENDING', 'READY')).toBe(false);
    expect(canTransition('COMPLETED', 'PREPARING')).toBe(false);
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
  });

  it('allows payment failure retry and cancellation', () => {
    expect(canTransition('PAYMENT_FAILED', 'PENDING')).toBe(true);
    expect(canTransition('PAYMENT_FAILED', 'CANCELLED')).toBe(true);
  });
});
