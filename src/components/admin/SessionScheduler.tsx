import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarDays, Plus, X, RefreshCw, AlertCircle } from 'lucide-react';

export function SessionScheduler() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch recurring events
  const { data: recurringEvents } = useQuery({
    queryKey: ['admin-recurring-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, recurrence_type, recurrence_days, event_time')
        .neq('recurrence_type', 'none')
        .not('recurrence_type', 'is', null)
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch sessions for the selected event
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['admin-event-sessions', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_sessions')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('session_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleGenerateSessions = async () => {
    if (!selectedEventId || !startDate || !endDate) {
      toast.error('Please select an event and date range');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_event_sessions', {
        p_event_id: selectedEventId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      toast.success(`${data} session(s) generated successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', selectedEventId] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', selectedEventId] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-event-sessions', selectedEventId] });
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
    <div className="space-y-6">
      {/* Event Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Select Event</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a recurring event" />
            </SelectTrigger>
            <SelectContent>
              {recurringEvents?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} ({event.recurrence_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        disabled={!selectedEventId || !startDate || !endDate || generating}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        {generating ? 'Generating...' : 'Generate Sessions'}
      </Button>

      {/* Sessions List */}
      {selectedEventId && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Sessions ({sessions?.length ?? 0})
          </h3>

          {loadingSessions ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {format(new Date(session.session_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                    </span>
                    {session.session_time && (
                      <span className="text-xs text-muted-foreground">
                        {session.session_time}
                      </span>
                    )}
                    <Badge className={statusColor[session.status] || ''} variant="secondary">
                      {session.status}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    {session.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8"
                        onClick={() => handleCancelSession(session.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    ) : session.status === 'cancelled' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 h-8"
                        onClick={() => handleReactivateSession(session.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Reactivate
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions generated yet. Use the form above to generate sessions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
