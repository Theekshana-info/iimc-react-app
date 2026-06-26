import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  RefreshCw, 
  ArrowUpDown, 
  Clock, 
  Inbox 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollReveal } from '@/components/ScrollReveal';
import { formatEventSchedule } from '@/lib/eventUtils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  return 'Workshops'; // default fall back
}

type EventStatus = 'Upcoming' | 'Closing Soon' | 'Sold Out' | 'Cancelled';

function getEventStatus(event: {
  event_date: string;
  capacity?: number | null;
}): EventStatus {
  const now = new Date();
  const eventDateObj = new Date(event.event_date);
  const diffTime = eventDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (event.capacity && event.capacity <= 5) {
    return 'Sold Out';
  }
  
  if (diffDays > 0 && diffDays <= 3) {
    return 'Closing Soon';
  }

  return 'Upcoming';
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 22 
    } 
  }
};

export default function Events() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('soonest');
  const [visibleCount, setVisibleCount] = useState(8);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // Fetch all events: pinned first, then by date ascending.
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
      ) || [];
    },
  });

  const matchesDateFilter = (eventDateStr: string, filter: string) => {
    if (filter === 'all') return true;
    const eventDateObj = new Date(eventDateStr);
    const now = new Date();
    
    const eventDate = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filter === 'today') {
      return eventDate.getTime() === today.getTime();
    }
    
    if (filter === 'this-week') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate <= endOfWeek;
    }
    
    if (filter === 'this-month') {
      const endOfMonth = new Date(today);
      endOfMonth.setDate(today.getDate() + 30);
      return eventDate >= today && eventDate <= endOfMonth;
    }
    
    return true;
  };

  const matchesTypeFilter = (recurrenceType: string | null | undefined, filter: string) => {
    if (filter === 'all') return true;
    const isRecurring = recurrenceType && recurrenceType !== 'none';
    if (filter === 'one-time') return !isRecurring;
    if (filter === 'recurring') return isRecurring;
    return true;
  };

  // Processing search, filter and sort
  const filteredEvents = (events || [])
    .filter(event => {
      // Category Match
      const category = getEventCategory(event);
      const matchesCategory = categoryFilter === 'all' || category.toLowerCase() === categoryFilter.toLowerCase();

      // Date Match
      const matchesDate = matchesDateFilter(event.event_date, dateFilter);

      // Type Match
      const matchesType = matchesTypeFilter(event.recurrence_type, typeFilter);

      return matchesCategory && matchesDate && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'soonest') {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      }
      if (sortBy === 'latest') {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      }
      if (sortBy === 'price-asc') {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceA - priceB;
      }
      if (sortBy === 'price-desc') {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceB - priceA;
      }
      if (sortBy === 'capacity-desc') {
        const capA = a.capacity || 0;
        const capB = b.capacity || 0;
        return capB - capA;
      }
      return 0;
    });

  const clearFilters = () => {
    setCategoryFilter('all');
    setDateFilter('all');
    setTypeFilter('all');
    setSortBy('soonest');
  };

  // Paged events
  const pagedEvents = filteredEvents.slice(0, visibleCount);

  // Statistics calculation
  const totalEventsCount = events?.length || 0;
  const categoriesCount = new Set(events?.map(e => getEventCategory(e))).size || 6;
  const attendeesCount = events?.reduce((sum, e) => sum + (e.capacity || 25), 0) || 500;

  return (
    <div className="min-h-screen py-16 gradient-hero bg-background/50 text-foreground transition-colors duration-300">
      <div className="container max-w-7xl px-4 mx-auto">
        
        {/* Compact Premium Hero Section */}
        <div className="relative mb-12 text-center overflow-hidden py-6">
          <ScrollReveal>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
              <Calendar className="h-3.5 w-3.5" /> Upcoming Gatherings
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Upcoming Events</h1>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6">
              Discover workshops, seminars and community programs. Join us for transformative meditation sessions and retreats.
            </p>
          </ScrollReveal>

          {/* Quick Statistics Row */}
          <ScrollReveal delay={150}>
            <div className="inline-flex items-center gap-6 md:gap-10 bg-background/30 backdrop-blur-sm border border-primary/10 px-6 py-2.5 rounded-2xl shadow-soft">
              <div className="text-center">
                <div className="text-lg md:text-xl font-black text-primary leading-tight">
                  {totalEventsCount}+
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Events</div>
              </div>
              <div className="h-6 w-px bg-primary/10" />
              <div className="text-center">
                <div className="text-lg md:text-xl font-black text-primary leading-tight">
                  {categoriesCount}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Categories</div>
              </div>
              <div className="h-6 w-px bg-primary/10" />
              <div className="text-center">
                <div className="text-lg md:text-xl font-black text-primary leading-tight">
                  {attendeesCount}+
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Attendees</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Scrollable Filters Section (Non-sticky, No z-index) */}
        <div className="w-full mb-8">
          <div className="bg-background/80 backdrop-blur-md border border-primary/10 shadow-soft rounded-2xl p-3 md:p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              {/* Category */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 w-full bg-background/50 border-primary/10 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 w-full bg-background/50 border-primary/10 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 w-full bg-background/50 border-primary/10 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full bg-background/50 border-primary/10 rounded-xl text-xs font-semibold">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soonest">Soonest First</SelectItem>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="capacity-desc">Capacity: High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-card border border-primary/5 h-[340px] sm:h-[410px] shadow-soft">
                <Skeleton className="aspect-video w-full rounded-t-2xl" />
                <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-12 sm:w-16 rounded-full" />
                      <Skeleton className="h-4 w-10 sm:w-12" />
                    </div>
                    <Skeleton className="h-4 sm:h-5 w-5/6" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                  </div>
                  <div className="space-y-1.5 my-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-primary/5">
                    <Skeleton className="h-3.5 w-12" />
                    <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Event Cards Grid - Responsive, 2 columns on Mobile */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
            >
              <AnimatePresence>
                {pagedEvents.map((event) => {
                  const eventDate = new Date(event.event_date);
                  const day = eventDate.getDate();
                  const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  const category = getEventCategory(event);
                  const status = getEventStatus(event);
                  const plainDescription = (event.description || '')
                    .replace(/<[^>]*>/g, '') // Strip HTML tags
                    .trim();
                  
                  return (
                    <motion.div
                      key={event.id}
                      variants={cardVariants}
                      layout
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-soft border border-primary/5 h-[340px] sm:h-[410px] hover:shadow-glow transition-all duration-300 ease-out hover:-translate-y-1.5"
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
                              status === 'Sold Out' && "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <ScrollReveal>
                <div className="text-center py-16 bg-card border border-primary/5 rounded-3xl p-8 max-w-md mx-auto shadow-soft mt-6">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4 animate-breathe">
                    <Inbox className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No events found</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-6 leading-relaxed">
                    We couldn't find any events matching your selected criteria. Try adjusting your search query, or clear filters to view all events.
                  </p>
                  <Button 
                    onClick={clearFilters}
                    className="h-9 px-4 text-xs font-bold"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </ScrollReveal>
            )}

            {/* Load More Pagination */}
            {filteredEvents.length > visibleCount && (
              <ScrollReveal>
                <div className="flex flex-col items-center justify-center gap-3 mt-12 py-4 border-t border-primary/5">
                  <span className="text-xs text-muted-foreground font-medium">
                    Showing {pagedEvents.length} of {filteredEvents.length} events
                  </span>
                  
                  {/* Progress Indicator */}
                  <div className="w-48 h-1 bg-primary/15 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-primary h-full transition-all duration-500 ease-out"
                      style={{ width: `${(pagedEvents.length / filteredEvents.length) * 100}%` }}
                    />
                  </div>
                  
                  <Button 
                    onClick={() => setVisibleCount(prev => prev + 8)}
                    variant="outline"
                    className="h-10 px-6 text-xs font-bold border-primary/20 hover:bg-primary/5 text-primary rounded-xl transition-smooth"
                  >
                    Load More Events
                  </Button>
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </div>
    </div>
  );
}
