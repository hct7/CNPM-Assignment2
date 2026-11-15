export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'PAYMENT_FAILED' | 'CANCELLED';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new Error(`Chuyển trạng thái không hợp lệ: ${from} -> ${to}`);
}
