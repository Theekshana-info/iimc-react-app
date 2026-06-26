import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from './RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  UsersRound, 
  CalendarDays, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Clock
} from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { EventRegistrationsView } from './EventRegistrationsView';
import { isEventUpcoming } from '@/lib/eventUtils';

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

function getAdminEventStatusBadge(event: any, paidRegs: number) {
  const now = new Date();
  const eventDateObj = new Date(event.event_date);
  const diffTime = eventDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (event.capacity && paidRegs >= event.capacity) {
    return (
      <Badge variant="outline" className="bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20 text-[9px] px-1.5 py-0 select-none">
        Sold Out
      </Badge>
    );
  }
  
  if (diffDays > 0 && diffDays <= 3) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0 select-none">
        Closing Soon
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0 select-none">
      Upcoming
    </Badge>
  );
}

export function EventsManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedSchedulerEvent, setSelectedSchedulerEvent] = useState<any>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [eventTime, setEventTime] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Collapse/Expand state for past events
  const [pastExpanded, setPastExpanded] = useState(false);
  const [visiblePastCount, setVisiblePastCount] = useState(5);

  const getTodayLocalString = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const handleRecurrenceChange = (value: string) => {
    setRecurrenceType(value);
    if (value === 'daily' || value === 'weekly') {
      setEventDate('');
    }
  };

  // Timezone-safe boundary (24 hours ago) to fetch candidates database-side
  const boundaryIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch Upcoming Events candidate slice (>= boundary) ordered by date ascending
  const { data: upcomingEvents, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['admin-upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_registrations (
            id,
            status
          )
        `)
        .gte('event_date', boundaryIso)
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch Past Events (< boundary) ordered by date descending
  const { data: pastEvents, isLoading: loadingPast } = useQuery({
    queryKey: ['admin-past-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_registrations (
            id,
            status
          )
        `)
        .lt('event_date', boundaryIso)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      const { error } = await supabase.from('events').insert(newEvent);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-past-events'] });
      toast.success('Event created');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-past-events'] });
      toast.success('Event updated');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-past-events'] });
      toast.success('Event deleted');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (event: any) => {
      const { id, created_at, event_registrations, ...rest } = event;
      
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const todayMidnightIso = `${year}-${month}-${date}T00:00:00.000Z`;

      const duplicatedEvent = {
        ...rest,
        title: `${event.title} (Copy)`,
        event_date: todayMidnightIso,
      };
      const { error } = await supabase.from('events').insert(duplicatedEvent);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-past-events'] });
      toast.success('Event duplicated successfully');
    },
    onError: (error) => {
      toast.error(`Duplication failed: ${error.message}`);
    }
  });

  const exportEventRegistrations = async (eventId: string, eventTitle: string) => {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'paid')
      .order('registered_at', { ascending: false });
    
    if (error || !data || data.length === 0) {
      toast.error(error ? 'Failed to export attendee list' : 'No paid registrations to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Registration Date', 'Status'];
    const rows = data.map((reg: any) => [
      reg.profiles?.full_name || '',
      reg.profiles?.email || '',
      reg.profiles?.phone || '',
      reg.registered_at ? format(new Date(reg.registered_at), 'PPP') : '',
      reg.status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle}-attendees.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendee list exported successfully');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setLocation('');
    setPrice('');
    setCapacity('');
    setImageUrl('');
    setIsPinned(true);
    setEventTime('');
    setRecurrenceType('none');
    setRecurrenceDays([]);
    setEditingEvent(null);
    setShowDialog(false);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setEventDate(event.event_date?.split('T')[0] || '');
    setLocation(event.location || '');
    setPrice(event.price?.toString() || '');
    setCapacity(event.capacity?.toString() || '');
    setImageUrl(event.image_url || '');
    setIsPinned(event.is_pinned || false);
    setEventTime(event.event_time || '');
    setRecurrenceType(event.recurrence_type || 'none');
    setRecurrenceDays(event.recurrence_days || []);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const eventData = {
      title,
      description,
      event_date: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
      location,
      price: price ? parseFloat(price) : 0,
      capacity: capacity ? parseInt(capacity) : null,
      image_url: imageUrl || null,
      is_pinned: isPinned,
      event_time: eventTime || null,
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceDays.length > 0 ? recurrenceDays : null,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, updates: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const matchesFilters = (event: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      event.title.toLowerCase().includes(searchLower) ||
      (event.location || '').toLowerCase().includes(searchLower);

    const category = getEventCategory(event);
    const matchesCategory = categoryFilter === 'all' || category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  };

  // Dynamically classify events into Upcoming and Past timezone-safely
  const classifiedUpcoming = (upcomingEvents || []).filter(e => isEventUpcoming(e.event_date, e.event_time));
  const transitionPast = (upcomingEvents || []).filter(e => !isEventUpcoming(e.event_date, e.event_time));
  const classifiedPast = [...transitionPast, ...(pastEvents || [])];

  const filteredUpcoming = classifiedUpcoming.filter(matchesFilters);
  const filteredPast = classifiedPast.filter(matchesFilters);

  return (
    <div className="space-y-6">
      
      {/* Top Statistics cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background/50 border border-primary/10 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-primary">
              {classifiedUpcoming.length}
            </div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Upcoming Events</div>
          </div>
          <CalendarDays className="h-8 w-8 text-primary/40" />
        </div>
        <div className="p-4 bg-background/50 border border-primary/10 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-muted-foreground">
              {classifiedPast.length}
            </div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Past Events</div>
          </div>
          <Clock className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>

      {/* Shared Filters and Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-background/50 border border-primary/10 p-3 rounded-2xl shadow-soft">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full bg-background/50 border-primary/10 rounded-xl text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px] bg-background/50 border-primary/10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="h-10 shrink-0 w-full sm:w-auto font-bold text-xs px-4 rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {/* 1. Upcoming Events Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Upcoming Events ({filteredUpcoming.length})
        </h3>
        
        {loadingUpcoming ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading upcoming events...</p>
        ) : (
          <div className="rounded-2xl border border-primary/5 bg-background/50 overflow-hidden shadow-soft">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-bold text-xs">Title</TableHead>
                  <TableHead className="font-bold text-xs">Date & Time</TableHead>
                  <TableHead className="font-bold text-xs">Venue & Organizer</TableHead>
                  <TableHead className="font-bold text-xs">Category & Status</TableHead>
                  <TableHead className="font-bold text-xs">Registrations</TableHead>
                  <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpcoming.length > 0 ? (
                  filteredUpcoming.map((event) => {
                    const category = getEventCategory(event);
                    const paidRegs = event.event_registrations?.filter((r: any) => r.status === 'paid').length || 0;
                    const fillRatio = event.capacity ? Math.min((paidRegs / event.capacity) * 100, 100) : 0;
                    
                    return (
                      <TableRow key={event.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-semibold py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground line-clamp-1">{event.title}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {event.is_pinned && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary w-fit text-[9px] px-1 py-0 select-none">
                                  Pinned
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Created: {event.created_at ? format(new Date(event.created_at), 'MMM d, yyyy') : '-'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{format(new Date(event.event_date), 'PPP')}</span>
                            {event.event_time && <span>{event.event_time}</span>}
                            {event.recurrence_type && event.recurrence_type !== 'none' && (
                              <Badge variant="outline" className="w-fit text-[9px] px-1 py-0 capitalize bg-primary/5 text-primary border-primary/20">
                                {event.recurrence_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <span className="line-clamp-1 text-foreground">{event.location || '-'}</span>
                            <span className="text-[10px]">Organizer: IIMC Staff</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 w-fit">
                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] w-fit">
                              {category}
                            </Badge>
                            {getAdminEventStatusBadge(event, paidRegs)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 w-24">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">{paidRegs}</span>
                              <span className="text-muted-foreground text-[10px]">/ {event.capacity || '∞'}</span>
                            </div>
                            {event.capacity && (
                              <div className="w-full h-1 bg-primary/15 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${fillRatio}%` }} />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {event.recurrence_type && event.recurrence_type !== 'none' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSchedulerEvent(event)}
                                className="h-8 px-2.5 text-xs"
                                title="Manage recurring sessions"
                              >
                                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                                Sessions
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedEvent(event); setShowRegistrations(true); }}
                              className="h-8 px-2.5 text-xs"
                              title="View registered attendees"
                            >
                              <UsersRound className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} title="Edit Event" className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate(event)} title="Duplicate Event" className="h-8 w-8 p-0">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this event?')) {
                                  deleteMutation.mutate(event.id);
                                }
                              }}
                              title="Delete Event"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      No upcoming events found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 2. Past Events Section */}
      <div className="border border-primary/10 rounded-2xl overflow-hidden bg-background/30 shadow-soft">
        <button
          onClick={() => setPastExpanded(!pastExpanded)}
          className="w-full flex items-center justify-between p-4 bg-background/50 hover:bg-background/80 transition-colors font-bold text-sm"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Past Events Section ({filteredPast.length})
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-normal mr-2">Calculated dynamically from event dates</span>
            {pastExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {pastExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {loadingPast ? (
              <p className="text-sm text-muted-foreground animate-pulse py-4">Loading past events...</p>
            ) : (
              <div className="rounded-xl border border-primary/5 bg-background/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Title</TableHead>
                      <TableHead className="font-bold text-xs">Date & Time</TableHead>
                      <TableHead className="font-bold text-xs">Venue & Organizer</TableHead>
                      <TableHead className="font-bold text-xs">Category & Status</TableHead>
                      <TableHead className="font-bold text-xs">Registrations</TableHead>
                      <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPast.length > 0 ? (
                      filteredPast.slice(0, visiblePastCount).map((event) => {
                        const category = getEventCategory(event);
                        const paidRegs = event.event_registrations?.filter((r: any) => r.status === 'paid').length || 0;
                        
                        return (
                          <TableRow key={event.id} className="hover:bg-muted/30 transition-colors opacity-90">
                            <TableCell className="font-medium py-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm text-foreground/80 line-clamp-1">{event.title}</span>
                                  <Badge variant="outline" className="bg-neutral-500/10 text-neutral-500 border-neutral-500/20 text-[9px] px-1.5 py-0 select-none">
                                    Past Event
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  Created: {event.created_at ? format(new Date(event.created_at), 'MMM d, yyyy') : '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span className="font-medium">{format(new Date(event.event_date), 'PPP')}</span>
                                {event.event_time && <span>{event.event_time}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span className="line-clamp-1">{event.location || '-'}</span>
                                <span className="text-[10px]">Organizer: IIMC Staff</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground font-semibold">{category}</span>
                                <Badge variant="secondary" className="bg-neutral-500/10 text-neutral-500 w-fit text-[9px] px-1 py-0 select-none border-none">
                                  Archived
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold">{paidRegs} / {event.capacity || '∞'}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportEventRegistrations(event.id, event.title)}
                                  className="h-8 px-2 text-xs"
                                  title="Export paid attendees as CSV"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Export
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setSelectedEvent(event); setShowRegistrations(true); }}
                                  className="h-8 px-2 text-xs"
                                  title="View registrations"
                                >
                                  <UsersRound className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} title="Edit Event" className="h-8 w-8 p-0">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate(event)} title="Duplicate Event" className="h-8 w-8 p-0">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Delete this event?')) {
                                      deleteMutation.mutate(event.id);
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/5"
                                  title="Delete Event"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                          No past events found matching the criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination / Lazy Load control for past events */}
                {filteredPast.length > visiblePastCount && (
                  <div className="p-3 bg-muted/20 border-t border-primary/5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisiblePastCount(prev => prev + 10)}
                      className="text-xs text-primary font-bold hover:bg-primary/5"
                    >
                      Load More Past Events ({filteredPast.length - visiblePastCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <RichTextEditor
              label="Description"
              value={description}
              onChange={setDescription}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Start Date / Event Date *</Label>
                <Input 
                  id="eventDate" 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  min={(!editingEvent && recurrenceType === 'none') ? getTodayLocalString() : undefined}
                />
              </div>
              <div>
                <Label htmlFor="eventTime">Time</Label>
                <Input id="eventTime" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurrence</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select 
                      value={recurrenceType === 'none' ? undefined : recurrenceType} 
                      onValueChange={handleRecurrenceChange}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-transparent bg-background px-4 py-2 text-base md:text-sm neu-inset transition-all focus:outline focus:outline-2 focus:outline-[#268ad1] focus:ring-0">
                        <SelectValue placeholder="One-time Event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly (Specific Days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrenceType !== 'none' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRecurrenceChange('none')}
                      className="h-12 px-3 rounded-xl border-transparent bg-background neu-btn text-destructive hover:text-destructive/80"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <Button
                      key={day}
                      type="button"
                      variant={recurrenceDays.includes(idx) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (recurrenceDays.includes(idx)) {
                          setRecurrenceDays(recurrenceDays.filter(d => d !== idx));
                        } else {
                          setRecurrenceDays([...recurrenceDays, idx]);
                        }
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (LKR)</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>
            <ImageUploadField
              label="Image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="events"
            />
            <div className="flex items-center gap-2 border-2 border-primary/20 rounded-lg p-3 bg-muted/20 w-max">
              <Switch id="isPinned" checked={isPinned} onCheckedChange={setIsPinned} />
              <Label htmlFor="isPinned" className="font-medium cursor-pointer">Pin event to top</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!title || (recurrenceType === 'none' && !eventDate)}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventRegistrationsView
        event={selectedEvent}
        open={showRegistrations}
        onOpenChange={(open) => { setShowRegistrations(open); if (!open) setSelectedEvent(null); }}
      />

      <Dialog open={!!selectedSchedulerEvent} onOpenChange={(open) => { if (!open) setSelectedSchedulerEvent(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Sessions: {selectedSchedulerEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedSchedulerEvent && (
            <InlineSessionScheduler event={selectedSchedulerEvent} onClose={() => setSelectedSchedulerEvent(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InlineSessionScheduler({ event, onClose }: { event: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch sessions for this event
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['admin-event-sessions', event.id],
    enabled: !!event.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_sessions')
        .select('*')
        .eq('event_id', event.id)
        .order('session_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleGenerateSessions = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_event_sessions', {
        p_event_id: event.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      toast.success(`${data} session(s) generated successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', event.id] });
    } catch (error) {
      console.error('Error generating sessions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate sessions');
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('event_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);
      if (error) throw error;
      toast.success('Session cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', event.id] });
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  const handleReactivateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('event_sessions')
        .update({ status: 'active' })
        .eq('id', sessionId);
      if (error) throw error;
      toast.success('Session reactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', event.id] });
    } catch (error) {
      toast.error('Failed to reactivate session');
    }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    rescheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col gap-2 text-sm text-foreground">
        <div>
          <span className="font-semibold text-muted-foreground">Recurrence Type:</span>{' '}
          <span className="capitalize font-medium">{event.recurrence_type}</span>
        </div>
        {event.event_time && (
          <div>
            <span className="font-semibold text-muted-foreground">Default Time:</span>{' '}
            <span className="font-medium">{event.event_time}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <Button
        onClick={handleGenerateSessions}
        disabled={!startDate || !endDate || generating}
        className="w-full gap-2 h-11"
      >
        <Plus className="h-4 w-4" />
        {generating ? 'Generating...' : 'Generate Event Sessions'}
      </Button>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Generated Sessions ({sessions?.length ?? 0})
        </h4>

        {loadingSessions ? (
          <p className="text-xs text-muted-foreground animate-pulse">Loading sessions...</p>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {format(new Date(session.session_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                  </span>
                  {session.session_time && (
                    <span className="text-xs text-muted-foreground">
                      ({session.session_time})
                    </span>
                  )}
                  <Badge className={`${statusColor[session.status] || ''} text-[10px]`} variant="secondary">
                    {session.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {session.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 h-7 text-xs"
                      onClick={() => handleCancelSession(session.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  ) : session.status === 'cancelled' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-500/10 h-7 text-xs"
                      onClick={() => handleReactivateSession(session.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reactivate
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg bg-muted/5">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50 text-muted-foreground" />
            <p className="text-xs">No sessions generated yet. Set a date range above to generate them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
