-- Fix search_path for all remaining functions with proper dependency handling
DROP FUNCTION IF EXISTS public.generate_qr_code(uuid);
CREATE OR REPLACE FUNCTION public.generate_qr_code(registration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN 'QR_' || registration_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
END;
$function$;

-- Update the existing function instead of dropping to avoid dependency issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Update the existing function instead of dropping
CREATE OR REPLACE FUNCTION public.generate_registration_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.qr_code = public.generate_qr_code(NEW.id);
    RETURN NEW;
END;
$function$;