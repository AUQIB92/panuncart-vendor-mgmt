-- Admin RPC Functions
-- These functions bypass RLS for admin operations using SECURITY DEFINER

-- Get all vendors for admin dashboard
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
  description text,
  logo_url text,
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
      v.description,
      v.logo_url,
      v.status,
      v.created_at,
      v.updated_at
    from public.vendors v
    order by v.created_at desc;
end;
$$;

-- Get all products with vendor info for admin
create or replace function public.admin_get_products()
returns table (
  id uuid,
  vendor_id uuid,
  title text,
  description text,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  sku text,
  barcode text,
  inventory_quantity integer,
  category text,
  tags text[],
  images text[],
  weight numeric(8,2),
  weight_unit text,
  status text,
  admin_notes text,
  shopify_product_id text,
  shopify_variant_id text,
  created_at timestamptz,
  updated_at timestamptz,
  vendor_business_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select 
      p.id,
      p.vendor_id,
      p.title,
      p.description,
      p.price,
      p.compare_at_price,
      p.sku,
      p.barcode,
      p.inventory_quantity,
      p.category,
      p.tags,
      p.images,
      p.weight,
      p.weight_unit,
      p.status,
      p.admin_notes,
      p.shopify_product_id,
      p.shopify_variant_id,
      p.created_at,
      p.updated_at,
      v.business_name as vendor_business_name
    from public.products p
    left join public.vendors v on p.vendor_id = v.id
    order by p.created_at desc;
end;
$$;

-- Update product status (approve/reject)
create or replace function public.admin_update_product_status(
  product_id uuid,
  new_status text,
  notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set 
    status = new_status,
    admin_notes = coalesce(notes, admin_notes),
    updated_at = now()
  where id = product_id;
  
  if not found then
    raise exception 'Product not found';
  end if;
end;
$$;

-- Set Shopify IDs after successful publish
create or replace function public.admin_set_shopify_ids(
  product_id uuid,
  s_product_id text,
  s_variant_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set 
    shopify_product_id = s_product_id,
    shopify_variant_id = s_variant_id,
    status = 'published',
    updated_at = now()
  where id = product_id;
  
  if not found then
    raise exception 'Product not found';
  end if;
end;
$$;

-- Get vendor stats for dashboard
create or replace function public.admin_get_vendor_stats()
returns table (
  total bigint,
  pending bigint,
  approved bigint,
  rejected bigint,
  suspended bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select 
      count(*) as total,
      count(*) filter (where status = 'pending') as pending,
      count(*) filter (where status = 'approved') as approved,
      count(*) filter (where status = 'rejected') as rejected,
      count(*) filter (where status = 'suspended') as suspended
    from public.vendors;
end;
$$;

-- Get product stats for dashboard
create or replace function public.admin_get_product_stats()
returns table (
  total bigint,
  draft bigint,
  pending bigint,
  approved bigint,
  rejected bigint,
  published bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select 
      count(*) as total,
      count(*) filter (where status = 'draft') as draft,
      count(*) filter (where status = 'pending') as pending,
      count(*) filter (where status = 'approved') as approved,
      count(*) filter (where status = 'rejected') as rejected,
      count(*) filter (where status = 'published') as published
    from public.products;
end;
$$;

-- Update vendor status
create or replace function public.admin_update_vendor_status(
  vendor_id uuid,
  new_status text,
  notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors
  set 
    status = new_status,
    updated_at = now()
  where id = vendor_id;
  
  if not found then
    raise exception 'Vendor not found';
  end if;
end;
$$;
