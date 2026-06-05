import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, CheckCircle, CreditCard, AlertCircle, RefreshCw, XCircle, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserActivitiesProps {
  userId: string;
}

type FilterType = 'all' | 'upcoming' | 'past';

export function UserRegistrations({ userId }: UserActivitiesProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch registrations, joining event_sessions if present
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['my-registrations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*),
          event_sessions (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'paid')
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredRegistrations = useMemo(() => {
    const items = registrations ?? [];
    if (filter === 'all') return items;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.filter((registration) => {
      const dateStr = registration.event_sessions?.session_date || registration.events?.event_date;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return filter === 'upcoming' ? date >= today : date < today;
    });
  }, [registrations, filter]);

  const emptyTitle = filter === 'all'
    ? 'No registrations found'
    : filter === 'upcoming'
      ? 'No upcoming events registered'
      : 'No past registrations found';

  if (isLoading) {
    return (
      <div className="space-y-4 py-6 text-center text-muted-foreground animate-pulse">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm">Loading your registrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['all', 'upcoming', 'past'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              filter === value
                ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                : 'border-border text-muted-foreground hover:text-primary hover:bg-muted/30'
            }`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {filteredRegistrations.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center bg-muted/10">
          <CardContent className="space-y-3">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground opacity-60" />
            <p className="font-semibold text-foreground">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Browse our events list to register for meditation sessions or study courses.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filteredRegistrations.map((registration) => {
            const isSession = !!registration.event_sessions;
            const dateVal = isSession 
              ? registration.event_sessions.session_date 
              : registration.events?.event_date;
            
            const timeVal = isSession
              ? registration.event_sessions.session_time
              : registration.events?.event_time;

            return (
              <Card key={registration.id} className="overflow-hidden hover:shadow-md transition-all duration-300 border border-border/80 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base line-clamp-1">{registration.events?.title || 'Event'}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-foreground">
                          {(() => {
                            if (!dateVal) return 'Date not set';
                            try {
                              const cleanDate = String(dateVal).includes('T') ? String(dateVal) : `${String(dateVal).trim()}T00:00:00`;
                              return format(new Date(cleanDate), 'EEEE, MMM d, yyyy');
                            } catch (e) {
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                        {timeVal && (
                          <>
                            <span>•</span>
                            <span>{timeVal}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1" variant="secondary">
                      <CheckCircle className="h-3 w-3" />
                      Confirmed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {isSession && (
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary font-medium">
                      Single Session Ticket
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>Registered: {registration.registered_at ? format(new Date(registration.registered_at), 'MMM d, yyyy') : 'N/A'}</span>
                    <Link
                      to={`/events/${registration.event_id}`}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UserSubscriptions({ userId }: UserActivitiesProps) {
  const queryClient = useQueryClient();
  const [cancellingSubscriptionId, setCancellingSubscriptionId] = useState<string | null>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['my-subscriptions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subscription cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions', userId] });
      setCancellingSubscriptionId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel subscription');
      setCancellingSubscriptionId(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'cancelled':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'suspended':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      case 'expired':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-6 text-center text-muted-foreground animate-pulse">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm">Loading your subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subscriptions.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center bg-muted/10">
          <CardContent className="space-y-3">
            <HeartHandshake className="h-10 w-10 mx-auto text-muted-foreground opacity-60" />
            <p className="font-semibold text-foreground">No recurring donations</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Support the meditation center on an ongoing basis to help maintain the sanctuary.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/donate">Setup Monthly Donation</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
            const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
            const nextCharge = subscription.next_charge_date ? new Date(subscription.next_charge_date) : null;
            const cancelledAt = subscription.cancelled_at ? new Date(subscription.cancelled_at) : null;
            const isActive = subscription.status === 'active';
            const isCancelled = subscription.status === 'cancelled';

            let progress = 0;
            let daysRemaining: number | null = null;

            if (isActive && startDate && endDate) {
              const totalDays = Math.max(1, differenceInDays(endDate, startDate));
              const usedDays = Math.max(0, differenceInDays(new Date(), startDate));
              progress = Math.min(100, Math.round((usedDays / totalDays) * 100));
              daysRemaining = Math.max(0, differenceInDays(endDate, new Date()));
            }

            return (
              <Card key={subscription.id} className="hover:shadow-md transition-all duration-300 border border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-bold capitalize">
                          {subscription.subscription_type === 'donation' ? 'Monthly Donation' : subscription.subscription_type}
                        </CardTitle>
                      </div>
                      <p className="text-lg font-extrabold text-foreground">
                        LKR {(subscription.amount || subscription.price || 0).toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground"> / month</span>
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(subscription.status)} hover:bg-transparent font-semibold capitalize`} variant="secondary">
                      {subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {startDate && (
                      <div>
                        <span className="text-muted-foreground block">Started</span>
                        <span className="font-semibold text-foreground">{format(startDate, 'PPP')}</span>
                      </div>
                    )}
                    {isActive && nextCharge && (
                      <div>
                        <span className="text-muted-foreground block">Next Charge Date</span>
                        <span className="font-semibold text-foreground">{format(nextCharge, 'PPP')}</span>
                      </div>
                    )}
                    {isCancelled && cancelledAt && (
                      <div>
                        <span className="text-muted-foreground block">Cancelled On</span>
                        <span className="font-semibold text-amber-600">{format(cancelledAt, 'PPP')}</span>
                      </div>
                    )}
                  </div>

                  {isActive && endDate && (
                    <div className="space-y-1.5 border-t pt-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Cycle Progress</span>
                        <span>{daysRemaining !== null ? `${daysRemaining} days left` : ''}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isActive && (
                    <div className="flex justify-end border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 h-9"
                        onClick={() => setCancellingSubscriptionId(subscription.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Donation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!cancellingSubscriptionId} onOpenChange={(open) => !open && setCancellingSubscriptionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Recurring Donation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your recurring monthly donation? This will stop all future automatic charges via PayHere. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setCancellingSubscriptionId(null)}
              disabled={cancelMutation.isPending}
            >
              No, keep active
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancellingSubscriptionId && cancelMutation.mutate(cancellingSubscriptionId)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, cancel donation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Backward compatible export
export function UserActivities({ userId }: UserActivitiesProps) {
  return (
    <div className="space-y-6">
      <UserRegistrations userId={userId} />
      <hr className="border-border my-6" />
      <UserSubscriptions userId={userId} />
    </div>
  );
}
