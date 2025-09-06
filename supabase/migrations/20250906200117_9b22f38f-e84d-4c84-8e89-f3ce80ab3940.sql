-- Create custom types for enums
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'waitlisted');
CREATE TYPE check_in_method AS ENUM ('qr_code', 'manual', 'mobile_app');
CREATE TYPE notification_type AS ENUM ('event_reminder', 'registration_confirmation', 'event_update', 'event_cancelled');

-- Create colleges table
CREATE TABLE public.colleges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    address TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (profiles for auth.users)
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    student_id TEXT,
    phone TEXT,
    profile_pic TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event categories table
CREATE TABLE public.event_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color_code TEXT NOT NULL DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'calendar',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    status event_status NOT NULL DEFAULT 'draft',
    registration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event tags junction table (many-to-many between events and categories)
CREATE TABLE public.event_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.event_categories(id) ON DELETE CASCADE,
    UNIQUE(event_id, category_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    registration_status registration_status NOT NULL DEFAULT 'pending',
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    qr_code TEXT UNIQUE,
    notes TEXT,
    UNIQUE(event_id, student_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    check_in_method check_in_method NOT NULL DEFAULT 'qr_code',
    checked_out_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    UNIQUE(registration_id)
);

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    anonymous BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(registration_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics summary table
CREATE TABLE public.analytics_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    total_registrations INTEGER NOT NULL DEFAULT 0,
    total_attendance INTEGER NOT NULL DEFAULT 0,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_rating DECIMAL(3,2),
    feedback_count INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for colleges
CREATE POLICY "Colleges are viewable by everyone" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can insert colleges" ON public.colleges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for users
CREATE POLICY "Users can view their own profile and users from their college" ON public.users FOR SELECT USING (
    auth.uid() = user_id OR 
    college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for event categories (public read, admin write)
CREATE POLICY "Event categories are viewable by everyone" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage event categories" ON public.event_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for events
CREATE POLICY "Events are viewable by users in the same college" ON public.events FOR SELECT USING (
    college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create events in their college" ON public.events FOR INSERT WITH CHECK (
    college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid()) AND
    created_by IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);
CREATE POLICY "Event creators and admins can update events" ON public.events FOR UPDATE USING (
    created_by IN (SELECT id FROM public.users WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin' AND college_id = events.college_id)
);

-- Create RLS policies for event tags
CREATE POLICY "Event tags are viewable by users in the same college" ON public.event_tags FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid()))
);
CREATE POLICY "Event creators can manage event tags" ON public.event_tags FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE created_by IN (SELECT id FROM public.users WHERE user_id = auth.uid()))
);

-- Create RLS policies for registrations
CREATE POLICY "Users can view registrations for events in their college" ON public.registrations FOR SELECT USING (
    student_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()) OR
    event_id IN (SELECT id FROM public.events WHERE college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid()))
);
CREATE POLICY "Students can register for events" ON public.registrations FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()) AND
    event_id IN (SELECT id FROM public.events WHERE college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid()))
);
CREATE POLICY "Students can update their own registrations" ON public.registrations FOR UPDATE USING (
    student_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);

-- Create RLS policies for attendance
CREATE POLICY "Users can view attendance for their college events" ON public.attendance FOR SELECT USING (
    registration_id IN (
        SELECT r.id FROM public.registrations r 
        JOIN public.events e ON r.event_id = e.id 
        WHERE e.college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Event organizers can manage attendance" ON public.attendance FOR ALL USING (
    registration_id IN (
        SELECT r.id FROM public.registrations r 
        JOIN public.events e ON r.event_id = e.id 
        WHERE e.created_by IN (SELECT id FROM public.users WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin' AND college_id = e.college_id)
    )
);

-- Create RLS policies for feedback
CREATE POLICY "Users can view feedback for their college events" ON public.feedback FOR SELECT USING (
    registration_id IN (
        SELECT r.id FROM public.registrations r 
        JOIN public.events e ON r.event_id = e.id 
        WHERE e.college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Students can provide feedback for their registrations" ON public.feedback FOR INSERT WITH CHECK (
    registration_id IN (
        SELECT r.id FROM public.registrations r 
        WHERE r.student_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
    )
);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);

-- Create RLS policies for analytics
CREATE POLICY "Users can view analytics for their college events" ON public.analytics_summary FOR SELECT USING (
    event_id IN (
        SELECT id FROM public.events 
        WHERE college_id IN (SELECT college_id FROM public.users WHERE user_id = auth.uid())
    )
);
CREATE POLICY "System can manage analytics" ON public.analytics_summary FOR ALL USING (true);

-- Create function to generate QR codes
CREATE OR REPLACE FUNCTION public.generate_qr_code(registration_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN 'QR_' || registration_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update analytics
CREATE OR REPLACE FUNCTION public.update_event_analytics(event_uuid UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to generate QR codes for registrations
CREATE OR REPLACE FUNCTION public.generate_registration_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qr_code = public.generate_qr_code(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_qr_code_trigger BEFORE INSERT ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.generate_registration_qr_code();

-- Create trigger to update analytics on registration changes
CREATE OR REPLACE FUNCTION public.trigger_update_analytics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_registration AFTER INSERT OR UPDATE OR DELETE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics();

-- Insert some default event categories
INSERT INTO public.event_categories (name, description, color_code, icon) VALUES
    ('Workshop', 'Educational workshops and training sessions', '#3B82F6', 'wrench'),
    ('Seminar', 'Academic seminars and lectures', '#10B981', 'presentation'),
    ('Festival', 'Cultural and entertainment festivals', '#F59E0B', 'music'),
    ('Hackathon', 'Programming competitions and hackathons', '#8B5CF6', 'code'),
    ('Sports', 'Sports events and competitions', '#EF4444', 'trophy'),
    ('Conference', 'Academic and professional conferences', '#6366F1', 'microphone'),
    ('Social', 'Social gatherings and networking events', '#EC4899', 'users'),
    ('Career', 'Career fairs and job placement events', '#14B8A6', 'briefcase');