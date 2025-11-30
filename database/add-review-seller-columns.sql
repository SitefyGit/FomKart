ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS seller_rating integer CHECK (seller_rating BETWEEN 1 AND 5);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS seller_comment text;
