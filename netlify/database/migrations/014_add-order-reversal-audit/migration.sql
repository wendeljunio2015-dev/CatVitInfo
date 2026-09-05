ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stock_restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commission_reversed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_stock_restored_at ON orders(stock_restored_at);
