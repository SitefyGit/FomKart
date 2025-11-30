-- Recompute product rating and review counts using the current reviews_count column
WITH product_stats AS (
  SELECT
    product_id,
    COUNT(*) FILTER (WHERE is_public AND rating IS NOT NULL) AS review_count,
    AVG(rating) FILTER (WHERE is_public AND rating IS NOT NULL) AS avg_rating
  FROM public.reviews
  WHERE is_public
  GROUP BY product_id
)
UPDATE public.products AS p
SET
  rating = COALESCE(ROUND(product_stats.avg_rating::numeric, 2), 0),
  reviews_count = COALESCE(product_stats.review_count, 0)
FROM product_stats
WHERE p.id = product_stats.product_id;

-- Default unrated products to zero values so UI stays in sync
UPDATE public.products AS p
SET rating = 0,
    reviews_count = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reviews AS r
  WHERE r.product_id = p.id
    AND r.is_public
    AND r.rating IS NOT NULL
);

-- Recompute seller rating and total_reviews based only on seller-specific feedback
WITH seller_stats AS (
  SELECT
    seller_id,
    COUNT(*) AS review_count,
    AVG(seller_rating) AS avg_rating
  FROM public.reviews
  WHERE is_public
    AND seller_rating IS NOT NULL
    AND seller_rating > 0
  GROUP BY seller_id
)
UPDATE public.users AS u
SET
  rating = COALESCE(ROUND(seller_stats.avg_rating::numeric, 2), 0),
  total_reviews = COALESCE(seller_stats.review_count, 0)
FROM seller_stats
WHERE u.id = seller_stats.seller_id;

-- Reset creators without seller feedback so their stats are accurate
UPDATE public.users AS u
SET rating = 0,
    total_reviews = 0
WHERE is_creator = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM public.reviews AS r
    WHERE r.seller_id = u.id
      AND r.is_public
      AND r.seller_rating IS NOT NULL
      AND r.seller_rating > 0
  );
