import { Hero } from '@/components/Hero';
import { HomeMessage } from '@/components/HomeMessage';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen, Heart, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 100}>
                <Card className="shadow-soft hover-lift overflow-hidden group h-full">
                  {event.image_url && (
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="group-hover:text-primary transition-smooth">{event.title}</CardTitle>
                      {event.is_pinned && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.event_date), 'PPP')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {event.description?.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <Button 
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="w-full hover-glow"
                    >
                      Learn More
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
