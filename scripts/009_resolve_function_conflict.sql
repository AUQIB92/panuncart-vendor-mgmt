-- Resolve Function Ambiguity
-- Fixes duplicate admin_update_vendor_status function definitions

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.admin_update_vendor_status(uuid, text);
DROP FUNCTION IF EXISTS public.admin_update_vendor_status(uuid, text, text);

-- Create the single, correct version with optional notes parameter
CREATE OR REPLACE FUNCTION public.admin_update_vendor_status(
  vendor_id uuid,
  new_status text,
  notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = vendor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;
END;
$$;

-- Also fix any other potentially conflicting functions
DROP FUNCTION IF EXISTS public.admin_approve_vendor(uuid);
DROP FUNCTION IF EXISTS public.admin_reject_vendor(uuid);
DROP FUNCTION IF EXISTS public.admin_suspend_vendor(uuid);
DROP FUNCTION IF EXISTS public.admin_reactivate_vendor(uuid);

-- Recreate vendor approval functions with consistent signatures
CREATE OR REPLACE FUNCTION public.admin_approve_vendor(
  vendor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = vendor_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending vendor not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_vendor(
  vendor_id uuid,
  rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    status = 'rejected',
    updated_at = NOW()
  WHERE id = vendor_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending vendor not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suspend_vendor(
  vendor_id uuid,
  suspension_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    status = 'suspended',
    updated_at = NOW()
  WHERE id = vendor_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approved vendor not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_vendor(
  vendor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = vendor_id AND status = 'suspended';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suspended vendor not found';
  END IF;
END;
$$;
