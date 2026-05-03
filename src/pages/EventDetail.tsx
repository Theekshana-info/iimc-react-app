import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registering, setRegistering] = useState(false);

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

  const { data: existingRegistration } = useQuery({
    queryKey: ['event-registration', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleRegister = async () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setRegistering(true);

    try {
      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (regError) throw regError;

      // If event has a price, navigate to payment
      if (event.price && event.price > 0) {
        navigate('/payment', {
          state: {
            amount: event.price,
            type: 'event_registration',
            relatedId: registration.id,
            description: `Registration for ${event.title}`,
          },
        });
      } else {
        // Free event - mark as paid immediately
        await supabase
          .from('event_registrations')
          .update({ status: 'paid' })
          .eq('id', registration.id);

        toast.success('Successfully registered for event!');
        setShowRegisterDialog(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setRegistering(false);
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
                <Calendar className="h-5 w-5 text-primary" />
                <span>{format(new Date(event.event_date), 'PPPp')}</span>
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
                  <span>Capacity: {event.capacity}</span>
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
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-center">
                    You are already registered for this event
                    <span className="ml-2 font-semibold">
                      (Status: {existingRegistration.status})
                    </span>
                  </p>
                </div>
                {existingRegistration.status === 'pending' && event.price && event.price > 0 && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      navigate('/payment', {
                        state: {
                          amount: event.price,
                          type: 'event_registration',
                          relatedId: existingRegistration.id,
                          description: `Registration for ${event.title}`,
                        },
                      });
                    }}
                  >
                    Complete Payment
                  </Button>
                )}
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
                disabled={registering}
              >
                {registering ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
