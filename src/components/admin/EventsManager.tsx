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
import { Pencil, Trash2, Plus, UsersRound, CalendarDays, X, RefreshCw, AlertCircle } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { EventRegistrationsView } from './EventRegistrationsView';

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

  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      const { error } = await supabase.from('events').insert(newEvent);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted');
    },
  });

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

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Event
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {event.title}
                    {event.is_pinned && <Badge variant="secondary" className="text-xs">Pinned</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{format(new Date(event.event_date), 'PPP')}</span>
                    {event.recurrence_type && event.recurrence_type !== 'none' && (
                      <Badge variant="outline" className="w-fit text-[10px] capitalize bg-primary/5 text-primary border-primary/20">
                        {event.recurrence_type}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{event.location || '-'}</TableCell>
                <TableCell>LKR {event.price}</TableCell>
                <TableCell>
                  {event.recurrence_type && event.recurrence_type !== 'none' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSchedulerEvent(event)}
                      className="flex items-center gap-1 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    >
                      <CalendarDays className="h-3 w-3" />
                      Manage
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedEvent(event); setShowRegistrations(true); }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <UsersRound className="h-3 w-3" />
                    View
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this event?')) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

// Inline Helper component for managing event sessions
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
