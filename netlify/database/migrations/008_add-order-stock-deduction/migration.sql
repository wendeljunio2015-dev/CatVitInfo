ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_stock_deducted_at_idx ON orders(stock_deducted_at);
