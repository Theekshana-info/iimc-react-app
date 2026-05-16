import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, CreditCard } from 'lucide-react';

interface UserActivitiesProps {
  userId: string;
}

type FilterType = 'all' | 'upcoming' | 'past';

export function UserActivities({ userId }: UserActivitiesProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Only fetch PAID registrations — pending/failed are invisible to users
  const { data: registrations } = useQuery({
    queryKey: ['my-registrations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'paid')
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['my-subscriptions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredRegistrations = useMemo(() => {
    const items = registrations ?? [];
    if (filter === 'all') return items;
    const today = new Date();

    return items.filter((registration) => {
      const eventDate = registration.events?.event_date;
      if (!eventDate) return false;
      const date = new Date(eventDate);
      return filter === 'upcoming' ? date >= today : date < today;
    });
  }, [registrations, filter]);

  const emptyTitle = filter === 'all'
    ? 'No events found'
    : filter === 'upcoming'
      ? 'No upcoming events found'
      : 'No past events found';

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Event Registrations</h3>
        <div className="flex flex-wrap gap-2">
          {(['all', 'upcoming', 'past'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                `px-4 py-2 rounded-full text-sm transition-smooth border ${filter === value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-primary'
                }`
              }
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>

        {filteredRegistrations.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">{emptyTitle}</p>
              <p className="text-sm text-muted-foreground">Your registrations will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{registration.events?.title || 'Event'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {registration.events?.event_date
                          ? format(new Date(registration.events.event_date), 'PPP')
                          : 'Date not set'}
                      </p>
                    </div>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Confirmed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Registered on {registration.registered_at
                      ? format(new Date(registration.registered_at), 'PPP')
                      : 'Date not available'}
                  </p>
                  <div className="flex justify-end">
                    <Link
                      to={`/events/${registration.event_id}`}
                      className="text-sm text-primary"
                    >
                      View Event
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border my-6" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subscriptions</h3>
        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
              const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
              const isActive = subscription.status === 'active';

              let progress = 0;
              let daysRemaining: number | null = null;

              if (isActive && startDate && endDate) {
                const totalDays = Math.max(1, differenceInDays(endDate, startDate));
                const usedDays = Math.max(0, differenceInDays(new Date(), startDate));
                progress = Math.min(100, Math.round((usedDays / totalDays) * 100));
                daysRemaining = Math.max(0, differenceInDays(endDate, new Date()));
              }

              return (
                <Card key={subscription.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{subscription.subscription_type}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">LKR {subscription.price}</p>
                      </div>
                      <Badge variant={
                        subscription.status === 'active' ? 'default' :
                          subscription.status === 'expired' ? 'secondary' :
                            'destructive'
                      }>
                        {subscription.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {startDate && (
                      <p className="text-sm text-muted-foreground">
                        Started: {format(startDate, 'PPP')}
                      </p>
                    )}
                    {isActive && endDate && (
                      <div className="space-y-2">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {daysRemaining !== null && (
                          <p className="text-xs text-muted-foreground">
                            {daysRemaining} days remaining
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No subscriptions found</p>
              <p className="text-sm text-muted-foreground">Your subscriptions will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
