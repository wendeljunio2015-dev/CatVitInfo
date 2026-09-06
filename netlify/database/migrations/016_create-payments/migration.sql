CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mercado_pago',
  provider_payment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  status_detail TEXT,
  payment_method TEXT,
  installments INTEGER,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN (
  'novo',
  'em_atendimento',
  'concluido',
  'cancelado',
  'aguardando_pagamento',
  'pago',
  'pago_revisao_estoque',
  'pagamento_recusado',
  'cancelled',
  'refunded',
  'charged_back'
));
