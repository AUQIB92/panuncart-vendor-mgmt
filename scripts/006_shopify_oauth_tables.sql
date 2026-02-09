-- Shopify OAuth Tokens Table
-- Stores access tokens obtained through OAuth flow

CREATE TABLE IF NOT EXISTS shopify_tokens (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopify_tokens_shop_domain ON shopify_tokens(shop_domain);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shopify_tokens_updated_at 
  BEFORE UPDATE ON shopify_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
