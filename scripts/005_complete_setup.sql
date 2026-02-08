-- Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS public.admin_get_vendors();
DROP FUNCTION IF EXISTS public.admin_get_products();
DROP FUNCTION IF EXISTS public.admin_update_product_status(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_set_shopify_ids(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_get_vendor_stats();
DROP FUNCTION IF EXISTS public.admin_get_product_stats();
DROP FUNCTION IF EXISTS public.admin_update_vendor_status(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_my_vendor();
DROP FUNCTION IF EXISTS public.get_my_products();
DROP FUNCTION IF EXISTS public.get_my_product(uuid);
DROP FUNCTION IF EXISTS public.insert_my_product(text, text, numeric, numeric, text, text, integer, text, text[], text[], numeric, text);
DROP FUNCTION IF EXISTS public.update_my_product(uuid, text, text, numeric, numeric, text, text, integer, text, text[], text[], numeric, text);
DROP FUNCTION IF EXISTS public.submit_product_for_review(uuid);
DROP FUNCTION IF EXISTS public.delete_my_draft_product(uuid);

-- Now create the updated functions

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

-- Vendor RPC Functions
-- These functions allow vendors to access their own data with proper security

-- Get current vendor's profile
create or replace function public.get_my_vendor()
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
    where v.id = auth.uid();
end;
$$;

-- Get current vendor's products
create or replace function public.get_my_products()
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
  updated_at timestamptz
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
      p.updated_at
    from public.products p
    where p.vendor_id = auth.uid()
    order by p.created_at desc;
end;
$$;

-- Get a specific product by ID (only if owned by current vendor)
create or replace function public.get_my_product(product_id uuid)
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
  updated_at timestamptz
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
      p.updated_at
    from public.products p
    where p.vendor_id = auth.uid() and p.id = product_id;
end;
$$;

-- Insert a new product for current vendor
create or replace function public.insert_my_product(
  p_title text,
  p_description text default null,
  p_price numeric(10,2) default 0,
  p_compare_at_price numeric(10,2) default null,
  p_sku text default null,
  p_barcode text default null,
  p_inventory_quantity integer default 0,
  p_category text default null,
  p_tags text[] default null,
  p_images text[] default null,
  p_weight numeric(8,2) default null,
  p_weight_unit text default 'kg'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_product_id uuid;
begin
  insert into public.products (
    vendor_id,
    title,
    description,
    price,
    compare_at_price,
    sku,
    barcode,
    inventory_quantity,
    category,
    tags,
    images,
    weight,
    weight_unit,
    status
  )
  values (
    auth.uid(),
    p_title,
    p_description,
    p_price,
    p_compare_at_price,
    p_sku,
    p_barcode,
    p_inventory_quantity,
    p_category,
    p_tags,
    p_images,
    p_weight,
    p_weight_unit,
    'draft'  -- Default to draft status
  )
  returning id into new_product_id;
  
  return new_product_id;
end;
$$;

-- Update a product owned by current vendor
create or replace function public.update_my_product(
  product_id uuid,
  p_title text default null,
  p_description text default null,
  p_price numeric(10,2) default null,
  p_compare_at_price numeric(10,2) default null,
  p_sku text default null,
  p_barcode text default null,
  p_inventory_quantity integer default null,
  p_category text default null,
  p_tags text[] default null,
  p_images text[] default null,
  p_weight numeric(8,2) default null,
  p_weight_unit text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set
    title = coalesce(p_title, title),
    description = coalesce(p_description, description),
    price = coalesce(p_price, price),
    compare_at_price = coalesce(p_compare_at_price, compare_at_price),
    sku = coalesce(p_sku, sku),
    barcode = coalesce(p_barcode, barcode),
    inventory_quantity = coalesce(p_inventory_quantity, inventory_quantity),
    category = coalesce(p_category, category),
    tags = coalesce(p_tags, tags),
    images = coalesce(p_images, images),
    weight = coalesce(p_weight, weight),
    weight_unit = coalesce(p_weight_unit, weight_unit),
    updated_at = now()
  where id = product_id and vendor_id = auth.uid() and status in ('draft', 'rejected');
  
  if not found then
    raise exception 'Product not found or cannot be updated';
  end if;
end;
$$;

-- Submit product for review (change status from draft/rejected to pending)
create or replace function public.submit_product_for_review(product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set
    status = 'pending',
    updated_at = now()
  where id = product_id and vendor_id = auth.uid() and status in ('draft', 'rejected');
  
  if not found then
    raise exception 'Product not found or cannot be submitted for review';
  end if;
end;
$$;

-- Delete a draft product owned by current vendor
create or replace function public.delete_my_draft_product(product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.products
  where id = product_id and vendor_id = auth.uid() and status = 'draft';
  
  if not found then
    raise exception 'Draft product not found';
  end if;
end;
$$;
