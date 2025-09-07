-- Seed initial college data
INSERT INTO public.colleges (name, domain, contact_email, address) VALUES 
('Default College', 'default.edu', 'admin@default.edu', '123 Campus Drive, Education City')
ON CONFLICT DO NOTHING;

-- Fix RLS policies for analytics_summary - restrict system writes to service role only
DROP POLICY IF EXISTS "System can manage analytics" ON public.analytics_summary;
CREATE POLICY "Service role can manage analytics" 
ON public.analytics_summary 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix RLS policies for notifications - restrict system writes to service role only  
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add unique constraint on users.user_id for 1:1 relationship with auth.users
ALTER TABLE public.users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);

-- Add composite unique constraint for student_id per college
ALTER TABLE public.users ADD CONSTRAINT users_student_id_college_unique UNIQUE (student_id, college_id);

-- Add missing triggers for attendance to update analytics
CREATE OR REPLACE FUNCTION public.trigger_update_analytics_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_event_analytics((
            SELECT r.event_id FROM public.registrations r WHERE r.id = NEW.registration_id
        ));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_event_analytics((
            SELECT r.event_id FROM public.registrations r WHERE r.id = OLD.registration_id
        ));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE TRIGGER attendance_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics_attendance();

-- Add missing triggers for feedback to update analytics
CREATE OR REPLACE FUNCTION public.trigger_update_analytics_feedback()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_event_analytics((
            SELECT r.event_id FROM public.registrations r WHERE r.id = NEW.registration_id
        ));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_event_analytics((
            SELECT r.event_id FROM public.registrations r WHERE r.id = OLD.registration_id
        ));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE TRIGGER feedback_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics_feedback();

-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_college_id_idx ON public.events (college_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_event_date_idx ON public.events (event_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS registrations_student_id_idx ON public.registrations (student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS registrations_event_id_idx ON public.registrations (event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_summary_event_id_idx ON public.analytics_summary (event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS attendance_registration_id_idx ON public.attendance (registration_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS feedback_registration_id_idx ON public.feedback (registration_id);