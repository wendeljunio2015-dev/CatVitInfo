ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE products
SET images = jsonb_build_array(image)
WHERE image IS NOT NULL
  AND image <> ''
  AND (images IS NULL OR jsonb_array_length(images) = 0);
