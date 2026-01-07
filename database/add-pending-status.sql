ALTER TABLE public.products DROP CONSTRAINT products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'paused', 'sold_out', 'archived', 'pending'));
