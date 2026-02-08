-- Performance Optimization Script
-- Adds missing indexes for faster queries

-- Index for vendor status lookups
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

-- Index for vendor email searches
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- Index for product status lookups
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Index for product vendor_id foreign key
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);

-- Index for created_at timestamps
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Composite index for common admin queries
CREATE INDEX IF NOT EXISTS idx_vendors_status_created ON vendors(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);

-- Refresh statistics for query planner
ANALYZE vendors;
ANALYZE products;
