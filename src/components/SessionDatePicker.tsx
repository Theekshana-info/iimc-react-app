import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, startOfDay } from 'date-fns';
import { CalendarDays, Check, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionDatePickerProps {
  eventId: string;
  eventCapacity: number | null;
  pricePerSession: number;
  onSelectionChange: (sessionIds: string[], totalPrice: number) => void;
  registeredSessionIds?: string[];
}

interface SessionWithCount {
  id: string;
  session_date: string;
  session_time: string | null;
  capacity_override: number | null;
  status: string;
  registered_count: number;
}

export function SessionDatePicker({
  eventId,
  eventCapacity,
  pricePerSession,
  onSelectionChange,
  registeredSessionIds = [],
}: SessionDatePickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch sessions with registration counts
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['event-sessions', eventId],
    queryFn: async () => {
      // Fetch all active sessions for this event
      const { data: sessionData, error } = await supabase
        .from('event_sessions')
        .select('id, session_date, session_time, capacity_override, status')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) throw error;
      if (!sessionData) return [];

      // Fetch registration counts for each session
      const sessionsWithCounts: SessionWithCount[] = await Promise.all(
        sessionData.map(async (session) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('session_id', session.id)
            .eq('status', 'paid');

          return {
            ...session,
            registered_count: count ?? 0,
          };
        })
      );

      return sessionsWithCounts;
    },
  });

  const toggleSession = (sessionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }

      const ids = Array.from(next);
      onSelectionChange(ids, ids.length * pricePerSession);
      return next;
    });
  };

  const selectAll = () => {
    if (!sessions) return;
    const available = sessions.filter((s) => {
      const cap = s.capacity_override ?? eventCapacity;
      const isFull = cap ? s.registered_count >= cap : false;
      const isAlreadyRegistered = registeredSessionIds?.includes(s.id);
      return !isFull && !isAlreadyRegistered;
    });
    const ids = available.map((s) => s.id);
    const newSet = new Set(ids);
    setSelectedIds(newSet);
    onSelectionChange(ids, ids.length * pricePerSession);
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    onSelectionChange([], 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading sessions...</span>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming sessions available for this event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Select Sessions</span>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={selectAll}>
            Select All
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={clearAll}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="grid gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
        {sessions.map((session) => {
          const capacity = session.capacity_override ?? eventCapacity;
          const isAlreadyRegistered = registeredSessionIds?.includes(session.id);
          const isFull = capacity ? session.registered_count >= capacity : false;
          const isSelected = selectedIds.has(session.id);
          const spotsLeft = capacity ? capacity - session.registered_count : null;
          const isDisabled = isFull || isAlreadyRegistered;

          return (
            <button
              key={session.id}
              disabled={isDisabled}
              onClick={() => toggleSession(session.id)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left',
                isSelected || isAlreadyRegistered
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                  : isDisabled
                    ? 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/30 cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Check circle */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                    isSelected || isAlreadyRegistered
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {(isSelected || isAlreadyRegistered) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                {/* Date & time */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {format(new Date(session.session_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                  </span>
                  {session.session_time && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatTime12h(session.session_time)}
                    </span>
                  )}
                </div>
              </div>

              {/* Capacity indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isAlreadyRegistered ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">Registered</Badge>
                ) : isFull ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Full</Badge>
                ) : spotsLeft !== null ? (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{spotsLeft} left</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Price summary */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} session{selectedIds.size > 1 ? 's' : ''} × LKR {pricePerSession}
          </span>
          <span className="text-base font-bold text-primary">
            LKR {(selectedIds.size * pricePerSession).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

/** Convert 24h time "HH:MM" → "h:MM AM/PM" */
function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;
}
