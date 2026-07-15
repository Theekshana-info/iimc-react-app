import { Hero } from '@/components/Hero';
import { ImageMarquee } from '@/components/ImageMarquee';
import { HomeMessage } from '@/components/HomeMessage';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen, Heart, Pin, RefreshCw, MapPin, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatEventSchedule, isEventUpcoming } from '@/lib/eventUtils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'All',
  'Meditation',
  'Retreats',
  'Workshops',
  'Seminars',
  'Yoga',
  'Community'
] as const;

type CategoryType = typeof CATEGORIES[number];

function getEventCategory(event: { title: string; description?: string | null }): CategoryType {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  if (text.includes('meditation') || text.includes('mindful') || text.includes('vipassana') || text.includes('zen') || text.includes('silent')) {
    return 'Meditation';
  }
  if (text.includes('retreat') || text.includes('intensive') || text.includes('camp') || text.includes('weekend')) {
    return 'Retreats';
  }
  if (text.includes('workshop') || text.includes('class') || text.includes('course') || text.includes('learn')) {
    return 'Workshops';
  }
  if (text.includes('yoga') || text.includes('asana') || text.includes('stretching') || text.includes('body')) {
    return 'Yoga';
  }
  if (text.includes('seminar') || text.includes('lecture') || text.includes('talk') || text.includes('discussion') || text.includes('presentation')) {
    return 'Seminars';
  }
  if (text.includes('community') || text.includes('gathering') || text.includes('meetup') || text.includes('social') || text.includes('tea')) {
    return 'Community';
  }
  return 'Workshops'; // default fallback
}

type EventStatus = 'Upcoming' | 'Closing Soon' | 'Cancelled';

function getEventStatus(event: {
  event_date: string;
  capacity?: number | null;
}): EventStatus {
  const now = new Date();
  const eventDateObj = new Date(event.event_date);
  const diffTime = eventDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0 && diffDays <= 3) {
    return 'Closing Soon';
  }

  return 'Upcoming';
}

export default function Home() {
  const navigate = useNavigate();

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      // Timezone-safe boundary (24 hours ago) to fetch candidates database-side
      const boundaryIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', boundaryIso)
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true })
        .limit(10); // fetch candidates first, then filter

      if (error) throw error;

      // Client-side timezone and time-aware upcoming classification
      const filtered = (data || []).filter(e => isEventUpcoming(e.event_date, e.event_time));
      return filtered.slice(0, 4);
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
        <section className="container max-w-7xl mx-auto px-4 py-20 relative">
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
            {upcomingEvents.map((event, index) => {
              const eventDate = new Date(event.event_date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              const category = getEventCategory(event);
              const status = getEventStatus(event);
              const plainDescription = (event.description || '')
                .replace(/<[^>]*>/g, '') // Strip HTML tags
                .trim();
              
              return (
                <ScrollReveal
                  key={event.id}
                  delay={index * 100}
                  className={cn(
                    "w-[calc(50%-6px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] flex flex-col",
                    index >= 2 && "hidden sm:flex"
                  )}
                >
                  <div
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-soft border border-primary/5 h-[340px] sm:h-[410px] hover:shadow-glow transition-all duration-300 ease-out hover:-translate-y-1.5 w-full text-left"
                  >
                    {/* Top Image (16:9 ratio) */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-neutral-200 dark:bg-neutral-800 shrink-0">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                          <Calendar className="h-8 w-8 text-primary/30" />
                        </div>
                      )}
                      
                      {/* Date Badge */}
                      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-md text-foreground rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 flex flex-col items-center shadow-md border border-primary/5 min-w-[36px] sm:min-w-[48px] select-none">
                        <span className="text-[8px] sm:text-[10px] font-bold text-primary tracking-wider leading-none mb-0.5">{month}</span>
                        <span className="text-xs sm:text-base font-extrabold leading-none">{day}</span>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[8px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2.5 py-0.5 rounded-lg shadow-sm">
                        {category}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between min-w-0">
                      <div className="space-y-1 sm:space-y-2">
                        {/* Status and Price */}
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border select-none",
                            status === 'Upcoming' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                            status === 'Closing Soon' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            status === 'Cancelled' && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                          )}>
                            {status}
                          </span>
                          <span className="text-[9px] sm:text-xs font-bold text-primary bg-primary/5 px-1.5 sm:px-2 py-0.5 rounded-lg">
                            {event.price !== null && event.price > 0 ? `LKR ${event.price.toLocaleString()}` : 'Free'}
                          </span>
                        </div>

                        {/* Title (Max 2 lines) */}
                        <h2 className="text-xs sm:text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200" title={event.title}>
                          {event.title}
                        </h2>

                        {/* Description (Max 2 lines) */}
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {plainDescription || "Join us for this special program. Discover your inner potential and connect with the community."}
                        </p>
                      </div>

                      {/* Metadata block (Location & Schedule) */}
                      <div className="space-y-1 sm:space-y-1.5 my-2 border-t border-primary/5 pt-2">
                        {event.location && (
                          <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/60 shrink-0" />
                            <span className="line-clamp-1" title={event.location}>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-muted-foreground">
                          {event.recurrence_type && event.recurrence_type !== 'none' ? (
                            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/60 shrink-0" />
                          ) : (
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/60 shrink-0" />
                          )}
                          <span className="line-clamp-1" title={formatEventSchedule(event)}>{formatEventSchedule(event)}</span>
                        </div>
                      </div>

                      {/* Card Footer Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-primary/5 mt-auto shrink-0">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium flex items-center gap-0.5 sm:gap-1">
                          <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/40 shrink-0" />
                          {event.capacity ? `${Math.round(event.capacity * 0.7)} reg.` : '15 reg.'}
                        </span>
                        <Button 
                          className="h-7 sm:h-8 px-2.5 sm:px-3.5 text-[10px] sm:text-[11px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg group-hover:scale-[1.02] transition-transform duration-200"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
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
