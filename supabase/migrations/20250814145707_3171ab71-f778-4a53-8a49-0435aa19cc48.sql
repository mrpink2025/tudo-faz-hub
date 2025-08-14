-- Create optimized indexes for better query performance
-- These indexes will significantly improve listing queries

-- Primary index for approved published listings
CREATE INDEX IF NOT EXISTS idx_listings_approved_status 
ON listings(approved, status) 
WHERE approved = true AND status = 'published';

-- Category-based queries with date ordering
CREATE INDEX IF NOT EXISTS idx_listings_category_created 
ON listings(category_id, created_at DESC) 
WHERE approved = true AND status = 'published';

-- Location-based search with full-text indexing
CREATE INDEX IF NOT EXISTS idx_listings_location_gin 
ON listings USING gin(to_tsvector('portuguese', location));

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_listings_price_range 
ON listings(price) 
WHERE price IS NOT NULL AND approved = true AND status = 'published';

-- Highlighted listings
CREATE INDEX IF NOT EXISTS idx_listings_highlighted 
ON listings(highlighted, created_at DESC) 
WHERE highlighted = true AND approved = true AND status = 'published';

-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_listings_search_gin 
ON listings USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- Composite index for pagination optimization
CREATE INDEX IF NOT EXISTS idx_listings_pagination 
ON listings(created_at DESC, id) 
WHERE approved = true AND status = 'published';

-- User listings (for user dashboard)
CREATE INDEX IF NOT EXISTS idx_listings_user_created 
ON listings(user_id, created_at DESC);