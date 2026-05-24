import { Hero } from '@/components/Hero';
import { ImageMarquee } from '@/components/ImageMarquee';
import { HomeMessage } from '@/components/HomeMessage';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen, Heart, Pin, RefreshCw, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatEventSchedule } from '@/lib/eventUtils';

export default function Home() {
  const navigate = useNavigate();

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true })
        .limit(6); // fetch more, then filter client-side

      if (error) throw error;

      // Show recurring events always + upcoming one-time events
      const now = new Date().toISOString();
      const filtered = data?.filter(
        (e) => e.recurrence_type !== 'none' && e.recurrence_type != null
          ? true
          : e.event_date >= now
      );
      return filtered?.slice(0, 3) ?? [];
    },
  });

  const features = [
    {
      icon: Calendar,
      title: 'Meditation Sessions',
      description: 'Join our daily group meditation sessions led by experienced teachers.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with like-minded individuals on the path to mindfulness.',
    },
    {
      icon: BookOpen,
      title: 'Teachings',
      description: 'Access our library of wisdom teachings and dharma talks.',
    },
    {
      icon: Heart,
      title: 'Wellness',
      description: 'Holistic approach to mental, physical, and spiritual well-being.',
    },
  ];

  return (
    <div className="min-h-screen">
      <Hero />

      <section className="py-12">
        <ImageMarquee />
      </section>

      {/* Features Section */}
      <section className="container px-4 py-20">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What We Offer
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover the transformative experiences we provide for your journey to inner peace
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card className="gradient-card shadow-soft hover-lift overflow-hidden group h-full">
                <CardHeader>
                  <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-smooth">
                    <feature.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-smooth">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="container px-4 py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent -z-10" />

          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Upcoming Events
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join us for these transformative meditation sessions and workshops
            </p>
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {upcomingEvents.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 100} className="h-full w-[calc(50%-6px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                <Card className="shadow-soft hover-lift overflow-hidden group h-full flex flex-col">
                  {event.image_url && (
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-32 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="group-hover:text-primary transition-smooth text-base sm:text-lg md:text-xl font-bold line-clamp-2">{event.title}</CardTitle>
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
                    <Button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="w-full hover-glow mt-auto text-xs sm:text-sm h-9 sm:h-10"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/events')}
                className="hover-lift"
              >
                View All Events
              </Button>
            </div>
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
