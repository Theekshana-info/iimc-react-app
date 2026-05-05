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
import { Pencil, Trash2, Plus, UsersRound } from 'lucide-react';
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
  const [isPinned, setIsPinned] = useState(true);
  const [eventTime, setEventTime] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);

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
                <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                <TableCell>{event.location || '-'}</TableCell>
                <TableCell>LKR {event.price}</TableCell>
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
                <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eventTime">Time</Label>
                <Input id="eventTime" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurrence</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time Event</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Specific Days)</SelectItem>
                  </SelectContent>
                </Select>
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
    </div>
  );
}
