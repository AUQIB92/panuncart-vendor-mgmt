-- Vendors table
create table if not exists public.vendors (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  gst_number text,
  business_address text,
  city text,
  state text,
  pincode text,
  description text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

-- Vendors can read their own row
create policy "vendors_select_own" on public.vendors
  for select using (auth.uid() = id);

-- Vendors can insert their own row
create policy "vendors_insert_own" on public.vendors
  for insert with check (auth.uid() = id);

-- Vendors can update their own row
create policy "vendors_update_own" on public.vendors
  for update using (auth.uid() = id);

-- Admin can read all vendors (admin role stored in user_metadata)
create policy "admin_select_all_vendors" on public.vendors
  for select using (
    (select (raw_user_meta_data ->> 'role') from auth.users where auth.users.id = auth.uid()) = 'admin'
  );

-- Admin can update all vendors
create policy "admin_update_all_vendors" on public.vendors
  for update using (
    (select (raw_user_meta_data ->> 'role') from auth.users where auth.users.id = auth.uid()) = 'admin'
  );

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  sku text,
  barcode text,
  inventory_quantity integer not null default 0,
  category text,
  tags text[],
  images text[],
  weight numeric(8,2),
  weight_unit text default 'kg',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'published')),
  admin_notes text,
  shopify_product_id text,
  shopify_variant_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Vendors can read their own products
create policy "vendors_select_own_products" on public.products
  for select using (auth.uid() = vendor_id);

-- Vendors can insert their own products
create policy "vendors_insert_own_products" on public.products
  for insert with check (auth.uid() = vendor_id);

-- Vendors can update their own products
create policy "vendors_update_own_products" on public.products
  for update using (auth.uid() = vendor_id);

-- Vendors can delete their own draft products
create policy "vendors_delete_own_products" on public.products
  for delete using (auth.uid() = vendor_id and status = 'draft');

-- Admin can read all products
create policy "admin_select_all_products" on public.products
  for select using (
    (select (raw_user_meta_data ->> 'role') from auth.users where auth.users.id = auth.uid()) = 'admin'
  );

-- Admin can update all products
create policy "admin_update_all_products" on public.products
  for update using (
    (select (raw_user_meta_data ->> 'role') from auth.users where auth.users.id = auth.uid()) = 'admin'
  );

-- Admin can delete all products
create policy "admin_delete_all_products" on public.products
  for delete using (
    (select (raw_user_meta_data ->> 'role') from auth.users where auth.users.id = auth.uid()) = 'admin'
  );

-- Trigger to auto-create vendor profile on signup with role=vendor
create or replace function public.handle_new_vendor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data ->> 'role') = 'vendor' then
    insert into public.vendors (id, business_name, contact_name, email, phone, gst_number, business_address, city, state, pincode, description)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'business_name', ''),
      coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'phone', null),
      coalesce(new.raw_user_meta_data ->> 'gst_number', null),
      coalesce(new.raw_user_meta_data ->> 'business_address', null),
      coalesce(new.raw_user_meta_data ->> 'city', null),
      coalesce(new.raw_user_meta_data ->> 'state', null),
      coalesce(new.raw_user_meta_data ->> 'pincode', null),
      coalesce(new.raw_user_meta_data ->> 'description', null)
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_vendor();

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vendors_updated_at
  before update on public.vendors
  for each row
  execute function public.update_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row
  execute function public.update_updated_at();
