import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Calendar, Star } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  college_id: string;
}

interface AnalyticsProps {
  profile: UserProfile;
}

export const Analytics = ({ profile }: AnalyticsProps) => {
  const [analytics, setAnalytics] = useState({
    eventTypeDistribution: [],
    monthlyEvents: [],
    attendanceRates: [],
    topEvents: [],
    registrationTrends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [profile.college_id]);

  const fetchAnalytics = async () => {
    try {
      await Promise.all([
        fetchEventTypeDistribution(),
        fetchMonthlyEvents(),
        fetchAttendanceRates(),
        fetchTopEvents(),
        fetchRegistrationTrends(),
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypeDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("event_type")
        .eq("college_id", profile.college_id);

      if (error) throw error;

      const distribution = data?.reduce((acc: any, event: any) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(distribution || {}).map(([type, count]) => ({
        name: type,
        value: count,
      }));

      setAnalytics(prev => ({ ...prev, eventTypeDistribution: chartData as any }));
    } catch (error) {
      console.error("Error fetching event type distribution:", error);
    }
  };

  const fetchMonthlyEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("event_date, created_at")
        .eq("college_id", profile.college_id)
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const monthlyData = data?.reduce((acc: any, event: any) => {
        const month = new Date(event.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(monthlyData || {}).map(([month, count]) => ({
        month,
        events: count,
      }));

      setAnalytics(prev => ({ ...prev, monthlyEvents: chartData as any }));
    } catch (error) {
      console.error("Error fetching monthly events:", error);
    }
  };

  const fetchAttendanceRates = async () => {
    try {
      const { data, error } = await supabase
        .from("analytics_summary")
        .select(`
          event_id,
          attendance_percentage,
          events(title, event_date)
        `)
        .not("events.college_id", "is", null)
        .limit(10)
        .order("attendance_percentage", { ascending: false });

      if (error) throw error;

      const chartData = data?.map((item: any) => ({
        name: item.events?.title?.substring(0, 20) + "..." || "Unknown",
        attendance: Math.round(item.attendance_percentage || 0),
      })) || [];

      setAnalytics(prev => ({ ...prev, attendanceRates: chartData as any }));
    } catch (error) {
      console.error("Error fetching attendance rates:", error);
    }
  };

  const fetchTopEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("analytics_summary")
        .select(`
          event_id,
          total_registrations,
          avg_rating,
          events(title, event_date)
        `)
        .not("events.college_id", "is", null)
        .order("total_registrations", { ascending: false })
        .limit(5);

      if (error) throw error;

      setAnalytics(prev => ({ ...prev, topEvents: data || [] }));
    } catch (error) {
      console.error("Error fetching top events:", error);
    }
  };

  const fetchRegistrationTrends = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          registration_date,
          events!inner(college_id)
        `)
        .eq("events.college_id", profile.college_id)
        .gte("registration_date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const dailyData = data?.reduce((acc: any, reg: any) => {
        const date = new Date(reg.registration_date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(dailyData || {})
        .slice(-30) // Last 30 days
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          registrations: count,
        }));

      setAnalytics(prev => ({ ...prev, registrationTrends: chartData as any }));
    } catch (error) {
      console.error("Error fetching registration trends:", error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Insights and metrics for your campus events</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{analytics.monthlyEvents.reduce((sum: number, item: any) => sum + item.events, 0)}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{analytics.registrationTrends.reduce((sum: number, item: any) => sum + item.registrations, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">
                  {Math.round(analytics.attendanceRates.reduce((sum: number, item: any) => sum + item.attendance, 0) / Math.max(analytics.attendanceRates.length, 1))}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {(analytics.topEvents.reduce((sum: number, item: any) => sum + (item.avg_rating || 0), 0) / Math.max(analytics.topEvents.length, 1)).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Type Distribution</CardTitle>
                <CardDescription>Breakdown of events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.eventTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.eventTypeDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Events</CardTitle>
                <CardDescription>Events created over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyEvents}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="events" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Events by Registration</CardTitle>
              <CardDescription>Most popular events in your college</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topEvents.map((event: any, index: number) => (
                  <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{event.events?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.events?.event_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{event.total_registrations} registrations</p>
                      <p className="text-sm text-muted-foreground">
                        {event.avg_rating ? `${event.avg_rating.toFixed(1)} ★` : 'No ratings'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rates</CardTitle>
              <CardDescription>Event attendance percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.attendanceRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Trends</CardTitle>
              <CardDescription>Daily registrations over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};