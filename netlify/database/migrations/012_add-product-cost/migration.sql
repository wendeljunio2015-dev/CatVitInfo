ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) CHECK (cost_price IS NULL OR cost_price >= 0);
