CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Coffee',
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO products (name, description, category, base_price, stock) VALUES
 ('Cà phê sữa đá', 'Espresso đậm vị cùng sữa đặc và đá.', 'Coffee', 35000, 40),
 ('Bạc xỉu', 'Sữa tươi dịu nhẹ với chút cà phê.', 'Coffee', 39000, 35),
 ('Trà đào cam sả', 'Trà trái cây thơm mát, cam và sả.', 'Tea', 45000, 30),
 ('Cold Brew', 'Ủ lạnh 18 giờ, hậu vị êm.', 'Coffee', 49000, 20)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER'
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0)
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  idempotency_key TEXT NOT NULL,
  provider_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, idempotency_key)
);
