ALTER TABLE customers
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique_idx
ON customers (LOWER(email))
WHERE email IS NOT NULL AND email <> '';
