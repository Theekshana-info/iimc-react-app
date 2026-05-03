import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function Events() {
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data;
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event, index) => (
            <ScrollReveal key={event.id} delay={index * 80}>
              <Card className="shadow-soft hover:shadow-glow transition-smooth h-full">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.event_date), 'PPP')}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Capacity: {event.capacity}
                    </div>
                  )}
                  {event.price !== null && (
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {event.price > 0 ? `LKR ${event.price}` : 'Free'}
                    </div>
                  )}
                  <p className="text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                  <Button className="w-full" onClick={() => navigate(`/events/${event.id}`)}>
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
