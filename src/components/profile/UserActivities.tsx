import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, CreditCard, CheckCircle } from 'lucide-react';

interface UserActivitiesProps {
  userId: string;
}

export function UserActivities({ userId }: UserActivitiesProps) {
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

  return (
    <Tabs defaultValue="registrations" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
        <TabsTrigger value="registrations">Event Registrations</TabsTrigger>
        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
      </TabsList>

      <TabsContent value="registrations" className="space-y-4">
        {registrations && registrations.length > 0 ? (
          registrations.map((registration) => (
            <Card key={registration.id} className="shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{registration.events?.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      {registration.events?.event_date &&
                        format(new Date(registration.events.event_date), 'PPP')}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Registered on {format(new Date(registration.registered_at), 'PPP')}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No event registrations yet</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="subscriptions" className="space-y-4">
        {subscriptions && subscriptions.length > 0 ? (
          subscriptions.map((subscription) => (
            <Card key={subscription.id} className="shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{subscription.subscription_type}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <CreditCard className="h-4 w-4" />
                      LKR {subscription.price}
                    </div>
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
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Started: {format(new Date(subscription.start_date), 'PPP')}
                </p>
                {subscription.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Ends: {format(new Date(subscription.end_date), 'PPP')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No active subscriptions</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
