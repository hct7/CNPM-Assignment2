CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code = upper(code)),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount INTEGER CHECK (max_discount IS NULL OR max_discount > 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (discount_type <> 'PERCENT' OR discount_value <= 100)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES promotions(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
UPDATE orders SET subtotal = total + discount_amount WHERE subtotal IS NULL;
ALTER TABLE orders ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_discount_nonnegative CHECK (discount_amount >= 0);
ALTER TABLE orders ADD CONSTRAINT orders_subtotal_nonnegative CHECK (subtotal >= 0);

ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0);
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  points_delta INTEGER NOT NULL CHECK (points_delta <> 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_order_award_unique
  ON loyalty_transactions(order_id) WHERE order_id IS NOT NULL;

INSERT INTO promotions(code, discount_type, discount_value, min_order_amount, max_discount, active)
VALUES ('WELCOME10', 'PERCENT', 10, 30000, 20000, TRUE)
ON CONFLICT (code) DO NOTHING;
