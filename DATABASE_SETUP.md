# Database Setup Instructions

## Prerequisites
1. Supabase project created
2. Supabase credentials (URL and ANON key)

## Setup Steps

1. **Create the database schema:**
   ```sql
   -- Run this first to create the base tables and RLS policies
   \i scripts/001_create_schema.sql
   ```

2. **Create admin RPC functions:**
   ```sql
   -- Run this to create admin functions for accessing all data
   \i scripts/003_admin_rpc_functions.sql
   ```

3. **Create vendor RPC functions:**
   ```sql
   -- Run this to create vendor functions for accessing their own data
   \i scripts/004_vendor_rpc_functions.sql
   ```

## Alternative: Run all scripts in order
```bash
# In your Supabase SQL editor, run these files in order:
1. scripts/001_create_schema.sql
2. scripts/003_admin_rpc_functions.sql
3. scripts/004_vendor_rpc_functions.sql
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Supabase and Shopify credentials.

## Verification

After running the scripts, you can verify the functions exist by running:

```sql
-- Check if admin functions exist
select proname from pg_proc where proname like 'admin_%';

-- Check if vendor functions exist
select proname from pg_proc where proname like 'get_my_%' or proname like 'insert_my_%' or proname like 'update_my_%' or proname like 'submit_%' or proname like 'delete_my_%';
```

## Troubleshooting

If you encounter errors:
1. Make sure you're running the scripts in the correct order
2. Check that your Supabase project has the necessary extensions enabled
3. Ensure you have the correct permissions to create functions
