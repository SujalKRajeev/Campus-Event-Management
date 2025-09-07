import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  college_id: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  venue: string;
  capacity: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  registration_deadline: string;
  created_at: string;
  registrations: { count: number }[];
}

interface EventsOverviewProps {
  profile: UserProfile;
}

export const EventsOverview = ({ profile }: EventsOverviewProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    myRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [profile.college_id]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          registrations(count)
        `)
        .eq("college_id", profile.college_id)
        .eq("status", "published")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(6);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // Total events in college
      const { count: totalEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("college_id", profile.college_id);

      // Upcoming events
      const { count: upcomingEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("college_id", profile.college_id)
        .eq("status", "published")
        .gte("event_date", new Date().toISOString());

      // Total registrations for college events
      const { data: registrations } = await supabase
        .from("registrations")
        .select("id")
        .in(
          "event_id",
          (await supabase
            .from("events")
            .select("id")
            .eq("college_id", profile.college_id)
          ).data?.map(e => e.id) || []
        );

      // My registrations
      const { count: myRegistrations } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("student_id", profile.id);

      setStats({
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEvents || 0,
        totalRegistrations: registrations?.length || 0,
        myRegistrations: myRegistrations || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          student_id: profile.id,
          registration_status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "You have successfully registered for the event.",
      });

      // Refresh events to update registration count
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the event.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Registrations</p>
                <p className="text-2xl font-bold">{stats.myRegistrations}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events happening soon in your college</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming events found</p>
              {profile.role === 'admin' && (
                <Button className="mt-4">Create Your First Event</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(event.event_date), "MMM dd, yyyy 'at' h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.registrations?.[0]?.count || 0} / {event.capacity} registered</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          View Details
                        </Button>
                        {profile.role === 'student' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRegister(event.id)}
                          >
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};