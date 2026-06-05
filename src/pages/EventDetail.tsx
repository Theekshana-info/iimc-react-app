import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, RefreshCw, Heart, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { formatEventScheduleLong } from '@/lib/eventUtils';
import { SessionDatePicker } from '@/components/SessionDatePicker';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Session-based registration state
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [sessionTotalPrice, setSessionTotalPrice] = useState(0);

  // Hybrid event donation state
  const [optionalDonation, setOptionalDonation] = useState(0);

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

  // Check if this event has sessions (recurring events)
  const { data: sessionCount } = useQuery({
    queryKey: ['event-session-count', id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id!)
        .eq('status', 'active');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const hasSessions = (sessionCount ?? 0) > 0;
  const isRecurring = event?.recurrence_type && event.recurrence_type !== 'none';
  const isFreeEvent = !event?.price || event.price === 0;
  const isHybridEvent = isFreeEvent; // Free events can have optional donation

  // Only check for PAID registrations — pending/incomplete are invisible to users
  const { data: existingRegistration } = useQuery({
    queryKey: ['event-registration', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id!)
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Count only PAID registrations for capacity calculation (non-session events)
  const { data: registrationCount } = useQuery({
    queryKey: ['event-registration-count', id],
    enabled: !!id && !hasSessions,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id!)
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
    setShowRegisterDialog(true);
  };

  const handleConfirmRegistration = async () => {
    if (!user || !event) return;

    // Determine the effective price
    const effectivePrice = hasSessions && selectedSessionIds.length > 0
      ? sessionTotalPrice
      : (event.price ?? 0);

    if (isFreeEvent) {
      // Free registration flow
      await handleFreeRegistration();

      // If there's an optional donation, proceed to payment for that
      if (optionalDonation > 0) {
        try {
          const donationId = crypto.randomUUID();
          await supabase.from('donations').insert({
            id: donationId,
            amount: optionalDonation,
            donor_name: user.user_metadata?.full_name || null,
            donor_email: user.email || null,
            donor_message: `Optional donation for event: ${event.title}`,
            status: 'pending',
          });

          navigate('/payment', {
            state: {
              amount: optionalDonation,
              type: 'donation',
              description: `Optional donation for ${event.title}`,
              donationId,
              isAnonymous: false,
            },
          });
        } catch (error) {
          // Q3: Registration succeeds even if donation fails
          console.error('Error creating optional donation:', error);
          toast.info('You are registered! The optional donation could not be processed.');
        }
      }
      return;
    }

    // Paid event — go to payment
    if (hasSessions && selectedSessionIds.length > 0) {
      // Multi-session paid checkout
      navigate('/payment', {
        state: {
          amount: sessionTotalPrice,
          type: 'event_registration',
          eventId: id,
          sessionIds: selectedSessionIds,
          description: `Registration for ${event.title} (${selectedSessionIds.length} session${selectedSessionIds.length > 1 ? 's' : ''})`,
        },
      });
    } else {
      // Single event paid checkout
      navigate('/payment', {
        state: {
          amount: event.price,
          type: 'event_registration',
          eventId: id,
          description: `Registration for ${event.title}`,
        },
      });
    }
  };

  const handleFreeRegistration = async () => {
    try {
      if (hasSessions && selectedSessionIds.length > 0) {
        // Register for each selected session
        for (const sessionId of selectedSessionIds) {
          const { error } = await supabase.rpc('register_free_event', {
            p_event_id: id,
            p_session_id: sessionId,
          });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.rpc('register_free_event', { p_event_id: id });
        if (error) throw error;
      }
      toast.success('Successfully registered for event!');
      setShowRegisterDialog(false);
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSessionSelectionChange = (ids: string[], total: number) => {
    setSelectedSessionIds(ids);
    setSessionTotalPrice(total);
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

  const isFull = !hasSessions && event.capacity && (registrationCount ?? 0) >= event.capacity;

  // Compute what price to show in the dialog
  const dialogPrice = hasSessions && selectedSessionIds.length > 0
    ? sessionTotalPrice
    : (event.price ?? 0);
  const canProceed = isFreeEvent
    ? (!hasSessions || selectedSessionIds.length > 0 || !isRecurring)
    : ((!hasSessions || selectedSessionIds.length > 0) && dialogPrice > 0);

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
              {event.capacity && !hasSessions && (
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
                    {event.price > 0
                      ? `LKR ${event.price}${hasSessions ? ' / session' : ''}`
                      : 'Free'}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">About This Event</h3>
              <div
                className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description || '') }}
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
                onClick={handleRegister}
              >
                Register for Event
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Registration Dialog */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-border/20">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5.5 w-5.5 text-primary" />
                <span>Confirm Registration</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                You are about to register for the following event. Please review the details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Event Title */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Event Title</span>
                <span className="text-base font-bold text-foreground leading-snug">{event.title}</span>
              </div>

              {/* Event Schedule & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{formatEventScheduleLong(event)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Session Date Picker (for recurring events with sessions) */}
              {hasSessions && isRecurring && (
                <div className="p-3 rounded-2xl bg-muted/30 border border-border/30">
                  <SessionDatePicker
                    eventId={id!}
                    eventCapacity={event.capacity}
                    pricePerSession={event.price ?? 0}
                    onSelectionChange={handleSessionSelectionChange}
                  />
                </div>
              )}

              {/* Price / Payment Badge Block */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-between mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Registration Type</span>
                  <span className="text-sm font-semibold text-foreground">
                    {isFreeEvent
                      ? 'Free Event'
                      : hasSessions && selectedSessionIds.length > 0
                        ? `Paid (${selectedSessionIds.length} session${selectedSessionIds.length > 1 ? 's' : ''})`
                        : 'Paid Registration'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    {dialogPrice > 0 ? `LKR ${dialogPrice.toLocaleString()}` : 'Free'}
                  </span>
                </div>
              </div>

              {/* Optional Donation for Hybrid (Free) Events */}
              {isHybridEvent && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Support with a Donation</span>
                    <span className="text-[10px] text-muted-foreground">(Optional)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[0, 500, 1000, 2500].map((amt) => (
                        <Button
                          key={amt}
                          variant={optionalDonation === amt ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() => setOptionalDonation(amt)}
                        >
                          {amt === 0 ? 'None' : `LKR ${amt}`}
                        </Button>
                      ))}
                    </div>
                    {optionalDonation > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        <Gift className="h-3 w-3 inline mr-1" />
                        Your donation of LKR {optionalDonation.toLocaleString()} will be processed after registration.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informative Hint */}
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 bg-primary/5 px-3 py-2.5 rounded-xl border border-primary/10">
                {dialogPrice > 0 || optionalDonation > 0
                  ? "Note: Clicking below will securely redirect you to PayHere gateway to complete your payment."
                  : "Note: Since this event is free, you will be registered immediately."}
              </p>

              {/* Terms & Conditions Agreement */}
              <p className="text-[11px] text-muted-foreground text-center mt-2 leading-relaxed">
                By proceeding, you agree to our{' '}
                <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:opacity-80">
                  Terms & Conditions
                </Link>
                .{dialogPrice > 0 || optionalDonation > 0 ? " Payments are processed securely via PayHere." : ""}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl py-3 h-auto font-semibold border-slate-200 dark:border-slate-800"
                onClick={() => setShowRegisterDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl py-3 h-auto font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/25"
                onClick={handleConfirmRegistration}
                disabled={!canProceed}
              >
                {isFreeEvent && optionalDonation === 0
                  ? 'Register Now'
                  : isFreeEvent && optionalDonation > 0
                    ? 'Register & Donate'
                    : 'Proceed to Pay'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
