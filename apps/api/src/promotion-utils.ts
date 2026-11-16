import { Pool } from 'pg';
import type { PoolClient } from 'pg';

export type PromotionRecord = {
  id: number;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
};

export async function findActivePromotion(db: Pool | PoolClient, code: string, lock = false) {
  const result = await db.query<PromotionRecord>(
    `SELECT id, code, discount_type AS "discountType", discount_value AS "discountValue",
            min_order_amount AS "minOrderAmount", max_discount AS "maxDiscount"
     FROM promotions
     WHERE code = $1 AND active = TRUE
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at > now())
     ${lock ? 'FOR UPDATE' : ''}`,
    [code],
  );
  return result.rows[0] ?? null;
}

export function calculatePromotionDiscount(promotion: PromotionRecord, subtotal: number) {
  const rawDiscount = promotion.discountType === 'PERCENT'
    ? Math.floor((subtotal * promotion.discountValue) / 100)
    : promotion.discountValue;
  return Math.max(0, Math.min(subtotal, rawDiscount, promotion.maxDiscount ?? subtotal));
}
