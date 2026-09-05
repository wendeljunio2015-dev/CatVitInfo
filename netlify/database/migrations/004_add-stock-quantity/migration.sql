ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0);

UPDATE products
SET stock_quantity = CASE
  WHEN stock_status = 'indisponivel' THEN 0
  WHEN stock_status = 'ultimas_unidades' THEN 1
  ELSE GREATEST(stock_quantity, 1)
END;
