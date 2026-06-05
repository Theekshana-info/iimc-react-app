import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipboardCheck, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AttendanceManager() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ['admin-events-for-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch sessions for the selected event
  const { data: sessions } = useQuery({
    queryKey: ['admin-attendance-sessions', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_sessions')
        .select('id, session_date, session_time, status')
        .eq('event_id', selectedEventId)
        .eq('status', 'active')
        .order('session_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch registered users for the selected session
  const { data: registrations } = useQuery({
    queryKey: ['admin-session-registrations', selectedSessionId],
    enabled: !!selectedSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('user_id, profiles!event_registrations_user_id_fkey(full_name, email)')
        .eq('session_id', selectedSessionId)
        .eq('status', 'paid');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch existing attendance for the session
  const { data: attendance } = useQuery({
    queryKey: ['admin-session-attendance', selectedSessionId],
    enabled: !!selectedSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', selectedSessionId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getAttendanceStatus = (userId: string): string => {
    const record = attendance?.find((a) => a.user_id === userId);
    return record?.status ?? 'unmarked';
  };

  const handleMarkAttendance = async (userId: string, status: 'present' | 'absent' | 'excused') => {
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('session_attendance')
        .upsert(
          {
            session_id: selectedSessionId,
            user_id: userId,
            status,
            marked_at: new Date().toISOString(),
            marked_by: adminUser?.id || null,
          },
          { onConflict: 'session_id,user_id' }
        );

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-session-attendance', selectedSessionId] });
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const handleBulkMarkAll = async (status: 'present' | 'absent') => {
    if (!registrations || registrations.length === 0) return;

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      const records = registrations.map((reg) => ({
        session_id: selectedSessionId,
        user_id: reg.user_id,
        status,
        marked_at: new Date().toISOString(),
        marked_by: adminUser?.id || null,
      }));

      const { error } = await supabase
        .from('session_attendance')
        .upsert(records, { onConflict: 'session_id,user_id' });

      if (error) throw error;
      toast.success(`All marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-session-attendance', selectedSessionId] });
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const statusStyles: Record<string, string> = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    excused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    unmarked: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Event</Label>
          <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setSelectedSessionId(''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select Session Date</Label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId} disabled={!selectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions?.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {format(new Date(session.session_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                  {session.session_time ? ` at ${session.session_time}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance List */}
      {selectedSessionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Attendance ({registrations?.length ?? 0} registered)
            </h3>
            {registrations && registrations.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleBulkMarkAll('present')}>
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleBulkMarkAll('absent')}>
                  Mark All Absent
                </Button>
              </div>
            )}
          </div>

          {registrations && registrations.length > 0 ? (
            <div className="space-y-2">
              {registrations.map((reg) => {
                const profile = reg.profiles as any;
                const currentStatus = getAttendanceStatus(reg.user_id);

                return (
                  <div
                    key={reg.user_id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {(profile?.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{profile?.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={statusStyles[currentStatus]} variant="secondary">
                        {currentStatus}
                      </Badge>
                      <div className="flex gap-1">
                        {(['present', 'absent', 'excused'] as const).map((s) => (
                          <Button
                            key={s}
                            variant={currentStatus === s ? 'default' : 'ghost'}
                            size="sm"
                            className={cn('h-7 text-xs px-2', currentStatus === s && 'pointer-events-none')}
                            onClick={() => handleMarkAttendance(reg.user_id, s)}
                          >
                            {s === 'present' ? <CheckCircle className="h-3.5 w-3.5" /> :
                              s === 'absent' ? <XCircle className="h-3.5 w-3.5" /> : 'E'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No registrations for this session yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
