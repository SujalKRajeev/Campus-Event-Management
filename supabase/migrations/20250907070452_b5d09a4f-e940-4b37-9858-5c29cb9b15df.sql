-- Fix the remaining update_event_analytics function
CREATE OR REPLACE FUNCTION public.update_event_analytics(event_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    reg_count INTEGER;
    att_count INTEGER;
    avg_rate DECIMAL(3,2);
    fb_count INTEGER;
BEGIN
    -- Get registration count
    SELECT COUNT(*) INTO reg_count FROM public.registrations WHERE event_id = event_uuid;
    
    -- Get attendance count
    SELECT COUNT(*) INTO att_count 
    FROM public.attendance a 
    JOIN public.registrations r ON a.registration_id = r.id 
    WHERE r.event_id = event_uuid;
    
    -- Get average rating
    SELECT AVG(rating), COUNT(*) INTO avg_rate, fb_count
    FROM public.feedback f 
    JOIN public.registrations r ON f.registration_id = r.id 
    WHERE r.event_id = event_uuid;
    
    -- Insert or update analytics
    INSERT INTO public.analytics_summary (
        event_id, total_registrations, total_attendance, 
        attendance_percentage, avg_rating, feedback_count, last_updated
    ) VALUES (
        event_uuid, reg_count, att_count,
        CASE WHEN reg_count > 0 THEN (att_count::DECIMAL / reg_count * 100) ELSE 0 END,
        avg_rate, COALESCE(fb_count, 0), NOW()
    )
    ON CONFLICT (event_id) DO UPDATE SET
        total_registrations = EXCLUDED.total_registrations,
        total_attendance = EXCLUDED.total_attendance,
        attendance_percentage = EXCLUDED.attendance_percentage,
        avg_rating = EXCLUDED.avg_rating,
        feedback_count = EXCLUDED.feedback_count,
        last_updated = NOW();
END;
$function$;

-- Fix the remaining trigger_update_analytics function  
CREATE OR REPLACE FUNCTION public.trigger_update_analytics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_event_analytics(NEW.event_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_event_analytics(OLD.event_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;