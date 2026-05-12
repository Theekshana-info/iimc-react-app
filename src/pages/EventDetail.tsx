import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatEventScheduleLong } from '@/lib/eventUtils';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Only check for PAID registrations — pending/incomplete are invisible to users
  const { data: existingRegistration } = useQuery({
    queryKey: ['event-registration', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Count only PAID registrations for capacity calculation
  const { data: registrationCount } = useQuery({
    queryKey: ['event-registration-count', id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'paid');

      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleRegister = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    // For free events, create a paid registration directly
    if (!event.price || event.price === 0) {
      handleFreeRegistration();
      return;
    }

    // For paid events, navigate to payment — NO registration created yet
    navigate('/payment', {
      state: {
        amount: event.price,
        type: 'event_registration',
        eventId: id,
        description: `Registration for ${event.title}`,
      },
    });
  };

  const handleFreeRegistration = async () => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'paid',
        });

      if (error) throw error;

      toast.success('Successfully registered for event!');
      setShowRegisterDialog(false);
      // Refresh the queries
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Event not found</p>
        <Button onClick={() => navigate('/events')}>Back to Events</Button>
      </div>
    );
  }

  const isFull = event.capacity && (registrationCount ?? 0) >= event.capacity;

  return (
    <div className="min-h-screen py-20">
      <div className="container px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <Card className="shadow-glow">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-96 object-cover rounded-t-lg"
            />
          )}
          <CardHeader>
            <CardTitle className="text-4xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {event.recurrence_type && event.recurrence_type !== 'none'
                  ? <RefreshCw className="h-5 w-5 text-primary" />
                  : <Calendar className="h-5 w-5 text-primary" />
                }
                <span>{formatEventScheduleLong(event)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {registrationCount ?? 0} / {event.capacity} registered
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.max(0, event.capacity - (registrationCount ?? 0))} spots available
                    </span>
                  </div>
                </div>
              )}
              {event.price !== null && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {event.price > 0 ? `LKR ${event.price}` : 'Free'}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">About This Event</h3>
              <div
                className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description || '' }}
              />
            </div>

            {existingRegistration ? (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-center p-4 rounded-lg">
                <p className="font-semibold">✓ You are registered for this event</p>
              </div>
            ) : isFull ? (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-center p-4 rounded-lg">
                <p className="font-semibold">This event is fully booked</p>
                <p className="text-sm mt-1">All {event.capacity} spots have been taken.</p>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowRegisterDialog(true)}
              >
                Register for Event
              </Button>
            )}
          </CardContent>
        </Card>

        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Registration</DialogTitle>
              <DialogDescription>
                Are you sure you want to register for "{event.title}"?
                {event.price && event.price > 0 && (
                  <span className="block mt-2 font-semibold">
                    Registration fee: LKR {event.price}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRegisterDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRegister}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
