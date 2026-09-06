CREATE TABLE IF NOT EXISTS order_notifications (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template_name TEXT,
  template_language TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  payload JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_notifications_status_check CHECK (status IN ('pending','sending','sent','delivered','read','failed')),
  CONSTRAINT order_notifications_attempts_check CHECK (attempts >= 0),
  UNIQUE (order_id, channel, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_status ON order_notifications(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_notifications_provider_message_id
  ON order_notifications(provider_message_id)
  WHERE provider_message_id IS NOT NULL;
