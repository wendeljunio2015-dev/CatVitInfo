CREATE TABLE IF NOT EXISTS commission_settlements (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  period_month DATE NOT NULL,
  sales_count INTEGER NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
  sales_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sales_total >= 0),
  commission_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_total >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_commission_settlements_period ON commission_settlements(period_month);
CREATE INDEX IF NOT EXISTS idx_commission_settlements_seller ON commission_settlements(seller_id);
