-- Fixed Admin RPC Functions
-- Updated to match actual database schema

-- Drop existing function first
DROP FUNCTION IF EXISTS public.admin_get_vendors();

-- Get all vendors for admin dashboard (fixed version)
create or replace function public.admin_get_vendors()
returns table (
  id uuid,
  business_name text,
  contact_name text,
  email text,
  phone text,
  gst_number text,
  business_address text,
  city text,
  state text,
  pincode text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select 
      v.id,
      v.business_name,
      v.contact_name,
      v.email,
      v.phone,
      v.gst_number,
      v.business_address,
      v.city,
      v.state,
      v.pincode,
      v.status,
      v.created_at,
      v.updated_at
    from public.vendors v
    order by v.created_at desc;
end;
$$;
