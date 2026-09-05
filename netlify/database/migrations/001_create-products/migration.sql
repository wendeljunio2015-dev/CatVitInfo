CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  warranty TEXT,
  stock_status TEXT NOT NULL DEFAULT 'em_estoque' CHECK (stock_status IN ('em_estoque', 'ultimas_unidades', 'indisponivel')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  badge TEXT CHECK (badge IS NULL OR badge IN ('Novo', 'Promoção', 'Destaque')),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured);
CREATE INDEX IF NOT EXISTS products_badge_idx ON products(badge);
