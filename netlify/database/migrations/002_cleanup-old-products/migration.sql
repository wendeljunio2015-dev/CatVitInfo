WITH newest_product AS (
  SELECT id
  FROM products
  ORDER BY created_at DESC, id DESC
  LIMIT 1
)
DELETE FROM products
WHERE id NOT IN (SELECT id FROM newest_product);
