import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Pin, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/ScrollReveal';
import { formatEventSchedule } from '@/lib/eventUtils';

export default function Events() {
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // Fetch all events: pinned first, then by date ascending.
      // We fetch ALL events (including recurring ones with older dates) so they stay visible.
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Filter: show one-time upcoming events + all recurring events
      const now = new Date().toISOString();
      return data?.filter(
        (e) => e.recurrence_type !== 'none' && e.recurrence_type != null
          ? true  // always show recurring events
          : e.event_date >= now // only show upcoming one-time events
      );
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Upcoming Events</h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Join us for transformative meditation sessions, workshops, and retreats.
          </p>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          {events?.map((event, index) => (
            <ScrollReveal key={event.id} delay={index * 80} className="h-full w-[calc(50%-6px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
              <Card className="shadow-soft hover:shadow-glow transition-smooth h-full flex flex-col">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-32 sm:h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold line-clamp-2">{event.title}</CardTitle>
                    {event.is_pinned && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0 text-[10px] sm:text-xs px-1.5 py-0.5">
                        <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    {event.recurrence_type && event.recurrence_type !== 'none'
                      ? <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      : <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    }
                    <span className="line-clamp-1">{formatEventSchedule(event)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      Capacity: {event.capacity}
                    </div>
                  )}
                  {event.price !== null && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      {event.price > 0 ? `LKR ${event.price}` : 'Free'}
                    </div>
                  )}
                  <Button className="w-full mt-auto text-xs sm:text-sm h-9 sm:h-10" onClick={() => navigate(`/events/${event.id}`)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {events?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No upcoming events at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
