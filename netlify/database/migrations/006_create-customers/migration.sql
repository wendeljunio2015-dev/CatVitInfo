CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  document TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique_idx
ON customers (phone)
WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON customers(created_at DESC);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
