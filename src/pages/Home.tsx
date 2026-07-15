import { Hero } from '@/components/Hero';
import { HomeMessage } from '@/components/HomeMessage';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, BookOpen, Heart, MapPin, Clock, RefreshCw,
  Leaf, Handshake, Sun, Sparkles,
  TreePine, Compass, CalendarDays, UsersRound, BookOpenCheck, Globe,
  ChevronRight, ArrowRight, User, Quote,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatEventSchedule, isEventUpcoming } from '@/lib/eventUtils';
import { cn } from '@/lib/utils';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

// ── Static images ──
import aboutImage from '@/assets/iimc-about-page-images/iimc-loby-1.jpeg';
import donationImage from '@/assets/iimc-about-page-images/iimc-loby-5.jpeg';

// ══════════════════════════════════════════════
// Helper utilities (events)
// ══════════════════════════════════════════════

const CATEGORIES = [
  'All', 'Meditation', 'Retreats', 'Workshops', 'Seminars', 'Yoga', 'Community',
] as const;

type CategoryType = typeof CATEGORIES[number];

function getEventCategory(event: { title: string; description?: string | null }): CategoryType {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  if (text.includes('meditation') || text.includes('mindful') || text.includes('vipassana') || text.includes('zen') || text.includes('silent')) return 'Meditation';
  if (text.includes('retreat') || text.includes('intensive') || text.includes('camp') || text.includes('weekend')) return 'Retreats';
  if (text.includes('workshop') || text.includes('class') || text.includes('course') || text.includes('learn')) return 'Workshops';
  if (text.includes('yoga') || text.includes('asana') || text.includes('stretching') || text.includes('body')) return 'Yoga';
  if (text.includes('seminar') || text.includes('lecture') || text.includes('talk') || text.includes('discussion') || text.includes('presentation')) return 'Seminars';
  if (text.includes('community') || text.includes('gathering') || text.includes('meetup') || text.includes('social') || text.includes('tea')) return 'Community';
  return 'Workshops';
}

type EventStatus = 'Upcoming' | 'Closing Soon' | 'Cancelled';

function getEventStatus(event: { event_date: string; capacity?: number | null }): EventStatus {
  const diffDays = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 3) return 'Closing Soon';
  return 'Upcoming';
}

// ══════════════════════════════════════════════
// Static content data
// ══════════════════════════════════════════════

const VALUES = [
  { icon: Leaf, title: 'Mindfulness', description: 'Cultivating present-moment awareness in every aspect of daily life.' },
  { icon: Heart, title: 'Compassion', description: 'Nurturing kindness toward ourselves and all living beings.' },
  { icon: Handshake, title: 'Community', description: 'Walking the path together in a supportive, inclusive sangha.' },
  { icon: Sun, title: 'Inner Peace', description: 'Discovering the stillness that lives within, beyond circumstance.' },
];

const OFFERINGS = [
  { icon: Calendar, title: 'Meditation Sessions', description: 'Daily group sessions guided by experienced teachers.' },
  { icon: Users, title: 'Community Gatherings', description: 'Connect with like-minded seekers on the path to mindfulness.' },
  { icon: BookOpen, title: 'Dharma Teachings', description: 'Access our library of wisdom teachings and talks.' },
  { icon: Sparkles, title: 'Wellness Programs', description: 'Holistic practices for mental, physical, and spiritual well-being.' },
];

const WISDOM_QUOTES = [
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
  { text: 'The present moment is the only moment available to us, and it is the door to all moments.', author: 'Thich Nhat Hanh' },
  { text: 'Quiet the mind, and the soul will speak.', author: 'Ma Jaya Sati Bhagavati' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', author: 'Thich Nhat Hanh' },
  { text: 'Be where you are, not where you think you should be.', author: 'Unknown' },
  { text: 'Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.', author: 'Arianna Huffington' },
  { text: 'The greatest weapon against stress is our ability to choose one thought over another.', author: 'William James' },
  { text: 'Within you, there is a stillness and a sanctuary to which you can retreat at any time.', author: 'Hermann Hesse' },
  { text: 'You cannot always control what goes on outside, but you can always control what goes on inside.', author: 'Wayne Dyer' },
  { text: 'When you realize nothing is lacking, the whole world belongs to you.', author: 'Lao Tzu' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { text: 'Silence is not the absence of something but the presence of everything.', author: 'Gordon Hempton' },
  { text: 'The only way to live is to accept each minute as an unrepeatable miracle.', author: 'Tara Brach' },
  { text: 'Where there is peace and meditation, there is neither anxiety nor doubt.', author: 'St. Francis of Assisi' },
  { text: 'Your calm mind is the ultimate weapon against your challenges.', author: 'Bryant McGill' },
  { text: 'The thing about meditation is: you become more and more you.', author: 'David Lynch' },
  { text: 'Meditation is a way for nourishing and blossoming the divinity within you.', author: 'Amit Ray' },
  { text: 'Mindfulness means being awake. It means knowing what you are doing.', author: 'Jon Kabat-Zinn' },
  { text: 'Calmness of mind is one of the beautiful jewels of wisdom.', author: 'James Allen' },
  { text: 'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.', author: 'Buddha' },
  { text: 'Learn to be calm and you will always be happy.', author: 'Paramahansa Yogananda' },
  { text: 'The soul always knows what to do to heal itself. The challenge is to silence the mind.', author: 'Caroline Myss' },
  { text: 'Breathing in, I calm body and mind. Breathing out, I smile.', author: 'Thich Nhat Hanh' },
  { text: 'Meditation brings wisdom; lack of meditation leaves ignorance.', author: 'Buddha' },
  { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass' },
  { text: 'Every morning we are born again. What we do today is what matters most.', author: 'Buddha' },
  { text: 'To understand the immeasurable, the mind must be extraordinarily quiet, still.', author: 'Jiddu Krishnamurti' },
  { text: 'If you want to conquer the anxiety of life, live in the moment, live in the breath.', author: 'Amit Ray' },
];

const TESTIMONIALS = [
  { name: 'Anura P.', review: 'IIMC has been a sanctuary for me during difficult times. The teachers are genuinely compassionate and the community feels like a second family. I look forward to every session.' },
  { name: 'Kumari S.', review: 'I was skeptical about meditation at first, but the guided sessions here changed my perspective entirely. The peaceful environment and patient guidance made all the difference.' },
  { name: 'Rajitha D.', review: 'The retreats at IIMC are unlike anything I have experienced. The combination of silence, nature, and expert teaching creates a space where real transformation happens.' },
];

const WHY_CHOOSE = [
  { icon: TreePine, title: 'Peaceful Environment', description: 'A serene setting designed for contemplation and inner work.' },
  { icon: Compass, title: 'Experienced Guidance', description: 'Teachers with years of practice and genuine dedication.' },
  { icon: CalendarDays, title: 'Weekly Sessions', description: 'Regular meditation sessions to build a consistent practice.' },
  { icon: UsersRound, title: 'Inclusive Community', description: 'Open to all, regardless of experience, background, or belief.' },
  { icon: BookOpenCheck, title: 'Practical Teachings', description: 'Wisdom that can be applied in everyday life, not just on the cushion.' },
  { icon: Globe, title: 'Open to Everyone', description: 'No prerequisites. Begin wherever you are on your journey.' },
];

const FAQ_ITEMS = [
  { q: 'Do I need prior meditation experience to attend?', a: 'No. Our sessions welcome complete beginners as well as experienced practitioners. Our teachers provide guidance appropriate for every level.' },
  { q: 'What should I bring to a meditation session?', a: 'Come in comfortable clothing. We provide meditation cushions and mats. You may bring a water bottle and a light shawl if you tend to feel cold during longer sits.' },
  { q: 'Are the sessions free of charge?', a: 'Many of our regular weekly sessions are offered on a donation basis. Retreats and special workshops may have a registration fee. Check the event details for specific pricing.' },
  { q: 'Can I attend sessions from a different religious or spiritual background?', a: 'Absolutely. IIMC welcomes people from all faiths and traditions. Our teachings focus on universal principles of mindfulness, compassion, and inner peace.' },
  { q: 'How can I support the center?', a: 'You can support IIMC through donations, volunteering your time, or simply spreading the word. Visit our Donate page to learn about ways you can contribute to our mission.' },
];

// ══════════════════════════════════════════════
// Reading time helper for blog
// ══════════════════════════════════════════════
function estimateReadingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Home() {
  const navigate = useNavigate();

  // ── Daily wisdom (deterministic rotation by day-of-year) ──
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const todayQuote = WISDOM_QUOTES[dayOfYear % WISDOM_QUOTES.length];

  // ── Queries ──

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const boundaryIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', boundaryIso)
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      const filtered = (data || []).filter(e => isEventUpcoming(e.event_date, e.event_time));
      return filtered.slice(0, 4);
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['home-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, summary, cover_image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['home-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, image_url, specialization, bio')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: blogPosts } = useQuery({
    queryKey: ['home-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`*, profiles:author_id (full_name)`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  // ══════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col">
      <HomeMessage />
      <Hero />

      {/* ────────────────────────────────────────────
          SECTION 1 — About IIMC
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <ScrollReveal direction="left">
              <div className="relative">
                <img
                  src={aboutImage}
                  alt="Meditation hall at IIMC"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[460px] object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            {/* Text */}
            <ScrollReveal direction="right">
              <div className="space-y-5">
                <span className="home-section-label">About Us</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  A sanctuary for mindfulness and inner peace
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  The Isipathana International Meditation Center (IIMC) is dedicated to offering practical teachings and contemplative practices that help people of all backgrounds discover lasting peace and clarity.
                </p>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Rooted in traditional wisdom and guided by experienced teachers, IIMC provides a welcoming space where individuals can slow down, reconnect with themselves, and cultivate a meaningful meditation practice.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="group rounded-full px-6"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 2 — Our Values
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="home-section-label">Our Values</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                What we believe
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 80}>
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <v.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 3 — What We Offer
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="home-section-label">What We Offer</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                Experiences for your journey
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {OFFERINGS.map((o, i) => (
              <ScrollReveal key={o.title} delay={i * 80}>
                <div className="group p-6 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] dark:bg-foreground/[0.04] hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.06] hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                  <div className="mb-5 w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                    <o.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{o.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{o.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 4 — Upcoming Events
      ──────────────────────────────────────────── */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <span className="home-section-label">Upcoming Events</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                  What is happening now
                </h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                  Join us for these upcoming meditation sessions and workshops
                </p>
              </div>
            </ScrollReveal>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
              {upcomingEvents.map((event, index) => {
                const eventDate = new Date(event.event_date);
                const day = eventDate.getDate();
                const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const category = getEventCategory(event);
                const status = getEventStatus(event);
                const plainDescription = (event.description || '').replace(/<[^>]*>/g, '').trim();

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
                      {/* Top Image */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-neutral-200 dark:bg-neutral-800 shrink-0">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
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

                          {/* Title */}
                          <h3 className="text-xs sm:text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200" title={event.title}>
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {plainDescription || "Join us for this special program. Discover your inner potential and connect with the community."}
                          </p>
                        </div>

                        {/* Metadata */}
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

                        {/* Footer */}
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
                  className="rounded-full px-6 group"
                  onClick={() => navigate('/events')}
                >
                  View All Events
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────
          SECTION 5 — Featured Activities
      ──────────────────────────────────────────── */}
      {activities && activities.length > 0 && (
        <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <span className="home-section-label">Life at IIMC</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                  Recent activities
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.map((activity, i) => (
                <ScrollReveal key={activity.id} delay={i * 100}>
                  <div
                    className="group relative overflow-hidden rounded-2xl cursor-pointer h-[280px] sm:h-[340px]"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    {activity.cover_image_url ? (
                      <img
                        src={activity.cover_image_url}
                        alt={activity.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5" />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <p className="text-white/60 text-xs mb-1.5">
                        {activity.created_at ? format(new Date(activity.created_at), 'MMMM d, yyyy') : ''}
                      </p>
                      <h3 className="text-white font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-sky-200 transition-colors">
                        {activity.title}
                      </h3>
                      {activity.summary && (
                        <p className="text-white/70 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
                          {activity.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  className="rounded-full px-6 group"
                  onClick={() => navigate('/activities')}
                >
                  Explore All Activities
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────
          SECTION 6 — Meet Our Teachers
      ──────────────────────────────────────────── */}
      {teachers && teachers.length > 0 && (
        <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <span className="home-section-label">Our Teachers</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                  Learn from experienced guides
                </h2>
              </div>
            </ScrollReveal>

            <div className={cn(
              "grid gap-8 lg:gap-10",
              teachers.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
              teachers.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {teachers.map((teacher, i) => (
                <ScrollReveal key={teacher.id} delay={i * 100}>
                  <div className="text-center p-6 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] dark:bg-foreground/[0.04] hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.06] h-full flex flex-col items-center transition-all hover:border-primary/20 duration-300">
                    {/* Portrait */}
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full overflow-hidden border-2 border-foreground/[0.06] mb-5 shrink-0">
                      {teacher.image_url ? (
                        <img
                          src={teacher.image_url}
                          alt={teacher.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <User className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-5">
                      <h3 className="text-xl font-bold text-foreground">{teacher.name}</h3>
                      {teacher.specialization && (
                        <Badge variant="secondary" className="text-xs font-medium bg-primary/5 border-primary/10 text-primary rounded-full px-3 py-1">
                          {teacher.specialization}
                        </Badge>
                      )}
                      {teacher.bio && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 max-w-xs mx-auto">
                          {teacher.bio}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-primary hover:bg-primary/5 rounded-full group mt-auto"
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      Read Biography
                      <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  className="rounded-full px-6 group"
                  onClick={() => navigate('/teachers')}
                >
                  View All Teachers
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────
          SECTION 7 — Latest Insights (Blog)
      ──────────────────────────────────────────── */}
      {blogPosts && blogPosts.length > 0 && (
        <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <span className="home-section-label">Latest Insights</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                  Continue your learning
                </h2>
              </div>
            </ScrollReveal>

            <div className={cn(
              "grid gap-8",
              blogPosts.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
              blogPosts.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" :
              "grid-cols-1 md:grid-cols-3"
            )}>
              {blogPosts.map((post, i) => {
                const readTime = estimateReadingTime(post.content || '');
                const excerpt = post.excerpt || (post.content || '').replace(/<[^>]*>/g, '').substring(0, 140);

                return (
                  <ScrollReveal key={post.id} delay={i * 100}>
                    <article
                      className="group cursor-pointer h-full flex flex-col"
                      onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                    >
                      {/* Image */}
                      {post.image_url && (
                        <div className="relative overflow-hidden rounded-xl mb-4 aspect-[16/10]">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <time dateTime={post.created_at || ''}>
                          {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : ''}
                        </time>
                        <span className="text-foreground/20">·</span>
                        <span>{readTime} min read</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-200 mb-2 line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                        {excerpt}
                      </p>

                      {/* Read Article */}
                      <span className="inline-flex items-center text-sm font-semibold text-primary mt-3 group-hover:underline underline-offset-4">
                        Read Article
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  className="rounded-full px-6 group"
                  onClick={() => navigate('/blog')}
                >
                  Explore All Articles
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────
          SECTION 8 — Daily Wisdom
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <Quote className="h-8 w-8 text-primary/30 mx-auto mb-6" />
            <blockquote className="home-quote">
              "{todayQuote.text}"
            </blockquote>
            <p className="mt-5 text-sm text-muted-foreground font-medium tracking-wide">
              — {todayQuote.author}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 9 — Testimonials
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="home-section-label">What Others Say</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                Words from our community
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="p-6 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] dark:bg-foreground/[0.04] h-full flex flex-col">
                  <Quote className="h-10 w-10 text-primary/20 mb-5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {t.review}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 10 — Why Choose IIMC
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="home-section-label">Why Choose IIMC</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                A place designed for practice
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {WHY_CHOOSE.map((w, i) => (
              <ScrollReveal key={w.title} delay={i * 80}>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <w.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{w.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 11 — Support Our Mission
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <img
                src={donationImage}
                alt="Community meditation at IIMC"
                className="w-full h-[280px] sm:h-[340px] object-cover rounded-2xl"
                loading="lazy"
              />
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="space-y-5">
                <span className="home-section-label">Support Our Mission</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Help us keep the doors open
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  IIMC operates through the generosity of our community. Your contribution helps us maintain a peaceful space, support our teachers, and offer programs to those who may not otherwise have access to meditation guidance.
                </p>
                <div className="pt-2">
                  <Button
                    className="rounded-full px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                    onClick={() => navigate('/donate')}
                  >
                    Make a Donation
                    <Heart className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 12 — FAQ
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-foreground/[0.06]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="home-section-label">Common Questions</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3">
                Frequently asked questions
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-foreground/[0.06]">
                  <AccordionTrigger className="home-faq-trigger">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECTION 13 — Final Call to Action
      ──────────────────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-foreground/[0.06]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Begin your journey today
            </h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              Whether you are taking your first step into meditation or deepening an existing practice, you are welcome here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8">
              <Button
                className="rounded-full px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto"
                onClick={() => navigate('/events')}
              >
                Join an Upcoming Session
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-8 py-3 font-semibold w-full sm:w-auto"
                onClick={() => navigate('/contact')}
              >
                Contact Us
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
