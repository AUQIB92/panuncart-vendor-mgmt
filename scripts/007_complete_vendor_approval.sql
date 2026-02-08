-- Complete Vendor Approval Functions Setup
-- This script drops existing functions and creates updated ones

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.admin_get_vendors_pending_approval();
DROP FUNCTION IF EXISTS public.admin_approve_vendor(uuid);
DROP FUNCTION IF EXISTS public.admin_reject_vendor(uuid, text);
DROP FUNCTION IF EXISTS public.admin_suspend_vendor(uuid, text);
DROP FUNCTION IF EXISTS public.admin_reactivate_vendor(uuid);
DROP FUNCTION IF EXISTS public.admin_get_vendor_details(uuid);

-- Vendor Approval Functions
-- These functions handle vendor registration approval workflow

-- Get pending vendors for admin approval
create or replace function public.admin_get_vendors_pending_approval()
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
    where v.status = 'pending'
    order by v.created_at asc;
end;
$$;

-- Approve a vendor
create or replace function public.admin_approve_vendor(
  vendor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors
  set 
    status = 'approved',
    updated_at = now()
  where id = vendor_id and status = 'pending';
  
  if not found then
    raise exception 'Pending vendor not found';
  end if;
end;
$$;

-- Reject a vendor
create or replace function public.admin_reject_vendor(
  vendor_id uuid,
  rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors
  set 
    status = 'rejected',
    updated_at = now()
  where id = vendor_id and status = 'pending';
  
  if not found then
    raise exception 'Pending vendor not found';
  end if;
end;
$$;

-- Suspend an approved vendor
create or replace function public.admin_suspend_vendor(
  vendor_id uuid,
  suspension_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors
  set 
    status = 'suspended',
    updated_at = now()
  where id = vendor_id and status = 'approved';
  
  if not found then
    raise exception 'Approved vendor not found';
  end if;
end;
$$;

-- Reactivate a suspended vendor
create or replace function public.admin_reactivate_vendor(
  vendor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors
  set 
    status = 'approved',
    updated_at = now()
  where id = vendor_id and status = 'suspended';
  
  if not found then
    raise exception 'Suspended vendor not found';
  end if;
end;
$$;

-- Get vendor by ID (for admin to view details)
create or replace function public.admin_get_vendor_details(
  vendor_id uuid
)
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
    where v.id = vendor_id;
end;
$$;
