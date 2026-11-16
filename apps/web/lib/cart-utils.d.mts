export type ToppingOption = Readonly<{ id: string; name: string; price: number }>;
export const TOPPING_OPTIONS: readonly ToppingOption[];
export function calculateUnitPrice(basePrice: number, size: string, toppings?: string[]): number;
export function calculateCartTotal(
  products: Array<{ id: number; basePrice: number }>,
  cart: Record<number, number>,
  sizes?: Record<number, string>,
  toppings?: Record<number, string[]>,
): number;
