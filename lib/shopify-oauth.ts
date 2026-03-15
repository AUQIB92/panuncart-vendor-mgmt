/**
 * Shopify OAuth Token Storage
 * Persists Shopify access tokens in Supabase so they survive serverless restarts.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

interface ShopifyTokenRow {
  id: number;
  shop_domain: string;
  access_token: string;
  expires_at: string | null;
  updated_at?: string;
}

export async function getShopifyAccessToken(shopDomain: string): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('shopify_tokens')
      .select('id, shop_domain, access_token, expires_at, updated_at')
      .eq('shop_domain', shopDomain)
      .maybeSingle<ShopifyTokenRow>();

    if (error) {
      console.error('Error retrieving Shopify token:', error.message);
      return null;
    }

    if (!data?.access_token) {
      console.log('No stored token found for shop:', shopDomain);
      return null;
    }

    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        console.log('Stored Shopify token is expired for shop:', shopDomain);
        return null;
      }
    }

    console.log('Using stored Shopify token for:', shopDomain);
    return data.access_token;
  } catch (error) {
    console.error('Error retrieving Shopify token:', error);
    return null;
  }
}

export async function storeShopifyToken(
  shopDomain: string,
  accessToken: string
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('shopify_tokens')
      .upsert(
        {
          shop_domain: shopDomain,
          access_token: accessToken,
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'shop_domain' }
      );

    if (error) {
      console.error('Error storing Shopify token:', error.message);
      return false;
    }

    console.log('Stored Shopify token for:', shopDomain);
    return true;
  } catch (error) {
    console.error('Error storing Shopify token:', error);
    return false;
  }
}

export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('shopify_tokens')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso)
      .select('id');

    if (error) {
      console.error('Error cleaning expired tokens:', error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
    return 0;
  }
}

export async function listStoredTokens() {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('shopify_tokens')
      .select('shop_domain, expires_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error listing tokens:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing tokens:', error);
    return [];
  }
}
