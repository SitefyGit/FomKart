ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_type_check CHECK (type IN ('product', 'service', 'course', 'consultation'));
