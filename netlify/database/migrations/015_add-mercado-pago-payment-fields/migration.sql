ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS payment_status_detail TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS payment_type_id TEXT,
ADD COLUMN IF NOT EXISTS payment_external_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_updated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique_idx
ON orders(payment_id)
WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_payment_external_reference_idx ON orders(payment_external_reference);
