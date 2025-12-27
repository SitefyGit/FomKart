-- Migration: Add GIN index on products.tags for efficient tag search
-- This improves performance for the SEO tag pages (/gigs/[tag])

-- Create GIN index on tags array for fast containment queries
CREATE INDEX IF NOT EXISTS idx_products_tags_gin 
ON public.products USING GIN (tags);

-- Create function to extract normalized tags for full-text search
CREATE OR REPLACE FUNCTION normalize_tag(tag text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(tag, '[^a-z0-9]+', '-', 'gi'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment explaining the tag system
COMMENT ON COLUMN public.products.tags IS 
'Array of tags for SEO and discovery. Tags are converted to URL slugs like "affiliate-marketing" for /gigs/affiliate-marketing pages.';

-- Create a view for popular tags (useful for sitemap generation and tag browsing)
CREATE OR REPLACE VIEW public.popular_tags AS
SELECT 
  unnest(tags) as tag,
  COUNT(*) as product_count
FROM public.products
WHERE status = 'active' 
  AND tags IS NOT NULL 
  AND array_length(tags, 1) > 0
GROUP BY unnest(tags)
ORDER BY product_count DESC;

COMMENT ON VIEW public.popular_tags IS 
'View showing all tags and their product counts, ordered by popularity. Used for the /gigs page and sitemap generation.';
