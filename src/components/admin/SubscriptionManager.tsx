import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { RefreshCw, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';

export function SubscriptionManager() {
  // Fetch all subscriptions with user info
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles!subscriptions_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch subscription attempts for overview
  const { data: recentAttempts } = useQuery({
    queryKey: ['admin-subscription-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_attempts')
        .select('*, subscriptions!subscription_attempts_subscription_id_fkey(user_id, profiles!subscriptions_user_id_fkey(full_name))')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Compute stats
  const activeCount = subscriptions?.filter((s) => s.status === 'active').length ?? 0;
  const totalMonthlyRevenue = subscriptions
    ?.filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount ?? s.price ?? 0), 0) ?? 0;
  const suspendedCount = subscriptions?.filter((s) => s.status === 'suspended').length ?? 0;

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">LKR {totalMonthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly Recurring</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suspendedCount}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          All Subscriptions ({subscriptions?.length ?? 0})
        </h3>

        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {subscriptions.map((sub) => {
              const profile = sub.profiles as any;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {(profile?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">LKR {(sub.amount ?? sub.price ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{sub.billing_cycle || 'monthly'}</p>
                    </div>
                    <Badge className={statusColor[sub.status ?? 'pending'] || ''} variant="secondary">
                      {sub.status || 'pending'}
                    </Badge>
                    {sub.next_charge_date && (
                      <span className="text-[10px] text-muted-foreground">
                        Next: {format(new Date(sub.next_charge_date), 'MMM d')}
                      </span>
                    )}
                    {(sub.retry_count ?? 0) > 0 && (
                      <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
                        Retry {sub.retry_count}/3
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No subscriptions yet.</p>
          </div>
        )}
      </div>

      {/* Recent Billing Attempts */}
      {recentAttempts && recentAttempts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent Billing Attempts</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      attempt.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }
                    variant="secondary"
                  >
                    {attempt.status}
                  </Badge>
                  <span className="text-muted-foreground">LKR {attempt.amount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {attempt.failure_reason && (
                    <span className="text-destructive truncate max-w-[150px]">{attempt.failure_reason}</span>
                  )}
                  <span>{format(new Date(attempt.created_at), 'MMM d, HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
