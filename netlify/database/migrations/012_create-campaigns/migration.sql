CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  button_label TEXT,
  button_url TEXT,
  image_url TEXT,
  theme TEXT NOT NULL DEFAULT 'blue' CHECK (theme IN ('blue','red','green','amber')),
  position INTEGER NOT NULL DEFAULT 1 CHECK (position >= 1 AND position <= 4),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_active_position ON campaigns(active, position);
