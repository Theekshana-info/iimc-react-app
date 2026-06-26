import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, RefreshCw, Heart, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { formatEventScheduleLong, isEventUpcoming } from '@/lib/eventUtils';
import { SessionDatePicker } from '@/components/SessionDatePicker';
import { cn } from '@/lib/utils';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const queryClient = useQueryClient();

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

  const isRecurring = event?.recurrence_type && event.recurrence_type !== 'none';
  const hasSessions = isRecurring;
  const isFreeEvent = !event?.price || event.price === 0;
  const isHybridEvent = isFreeEvent; // Free events can have optional donation

  // Fetch user's registrations for this event
  const { data: userRegistrations } = useQuery({
    queryKey: ['event-user-registrations', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id!)
        .eq('user_id', user.id)
        .eq('status', 'paid');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active upcoming sessions for this event
  const { data: upcomingSessions } = useQuery({
    queryKey: ['event-upcoming-sessions', id],
    enabled: !!id && !!hasSessions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_sessions')
        .select('id, session_date, session_time, capacity_override, status')
        .eq('event_id', id!)
        .eq('status', 'active')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const registeredSessionIds = userRegistrations
    ? userRegistrations.map((r) => r.session_id).filter((sid): sid is string => !!sid)
    : [];

  const isFullyRegistered = hasSessions
    ? (upcomingSessions && upcomingSessions.length > 0 && upcomingSessions.every((s) => registeredSessionIds.includes(s.id)))
    : (userRegistrations && userRegistrations.length > 0);

  const hasSomeRegistrations = hasSessions && registeredSessionIds.length > 0;

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
    setIsRegistering(true);
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

      // Invalidate queries to refresh state dynamically
      queryClient.invalidateQueries({ queryKey: ['event-user-registrations', id] });
      queryClient.invalidateQueries({ queryKey: ['event-session-count', id] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', id] });
      queryClient.invalidateQueries({ queryKey: ['event-upcoming-sessions', id] });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsRegistering(false);
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
  const isEventPast = event ? !isEventUpcoming(event.event_date, event.event_time) : false;

  // Compute what price to show in the dialog
  const dialogPrice = hasSessions && selectedSessionIds.length > 0
    ? sessionTotalPrice
    : (event.price ?? 0);
  const canProceed = !isEventPast && (isFreeEvent
    ? (!hasSessions || selectedSessionIds.length > 0 || !isRecurring)
    : ((!hasSessions || selectedSessionIds.length > 0) && dialogPrice > 0));

  return (
    <div className="min-h-screen py-24 relative overflow-hidden bg-background">
      {/* Ambient decorative blobs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="container px-4 max-w-6xl relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-8 group rounded-2xl hover:bg-primary/5 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Button>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Event Details Column (Left side) */}
          <div className="lg:col-span-2 space-y-8 animate-fade-in-up">
            
            {/* Unified Event Details Card */}
            <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-md rounded-[2.5rem] shadow-glow">
              
              {/* Event Hero Image (Blurred background + Sharp centered cover to prevent text banner cropping) */}
              {event.image_url && (
                <div className="relative overflow-hidden w-full aspect-video sm:aspect-[21/9] lg:h-[380px] bg-slate-950/10 border-b border-border/10">
                  {/* Blurred background image */}
                  <img
                    src={event.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none"
                  />
                  {/* Sharp centered image */}
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="relative z-10 w-full h-full object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-20 pointer-events-none" />
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-8">
                {/* Event Title */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                    {event.title}
                  </h1>
                </div>

                {/* Flat Details Badges Grid (Bordered top and bottom) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-border/20">
                  
                  {/* Schedule */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary">
                      {event.recurrence_type && event.recurrence_type !== 'none'
                        ? <RefreshCw className="h-6 w-6 animate-spin-slow" />
                        : <Calendar className="h-6 w-6" />
                      }
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Schedule</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 leading-snug">
                        {formatEventScheduleLong(event)}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Location</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 leading-snug truncate max-w-[120px]" title={event.location || 'Online'}>
                        {event.location || 'Online'}
                      </span>
                    </div>
                  </div>

                  {/* Attendance / Capacity */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Capacity</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 leading-snug">
                        {event.capacity && !hasSessions 
                          ? `${registrationCount ?? 0} / ${event.capacity} Filled`
                          : hasSessions 
                            ? 'Session Limits'
                            : 'Open Entry'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cost</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 leading-snug">
                        {event.price && event.price > 0
                          ? `LKR ${event.price.toLocaleString()}${hasSessions ? ' / sess' : ''}`
                          : 'Free'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Description */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">About This Event</h3>
                  <div
                    className="text-muted-foreground prose prose-slate dark:prose-invert max-w-none leading-relaxed text-sm md:text-base prose-headings:text-foreground prose-a:text-primary"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description || '') }}
                  />
                </div>

              </div>
            </Card>

          </div>

          {/* Sticky Registration Sidebar (Right side) */}
          <div className="lg:col-span-1 lg:sticky lg:top-28 space-y-6 animate-fade-in-scale">
            
            <Card className="shadow-glow border-none bg-card/65 backdrop-blur-md overflow-hidden rounded-[2rem]">
              <CardContent className="p-6 space-y-6">
                
                {/* Price Display */}
                <div className="text-center pb-6 border-b border-border/20">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Event Access</span>
                  <div className="text-3xl font-extrabold text-foreground mt-2 flex items-center justify-center gap-1">
                    {event.price && event.price > 0 ? (
                      <>
                        <span className="text-primary text-2xl font-bold">LKR</span>
                        <span>{event.price.toLocaleString()}</span>
                        {hasSessions && <span className="text-sm font-normal text-muted-foreground">/session</span>}
                      </>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Free Admission</span>
                    )}
                  </div>
                </div>

                {/* Capacity Progress Bar (non-session events) */}
                {event.capacity && !hasSessions && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="text-primary">{registrationCount ?? 0} / {event.capacity} booked</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden neu-inset">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((registrationCount ?? 0) / event.capacity) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>{Math.max(0, event.capacity - (registrationCount ?? 0))} spots remaining</span>
                      <span>{event.capacity} total spots</span>
                    </div>
                  </div>
                )}

                {/* Call To Action Button / Status State */}
                {isFullyRegistered ? (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-center p-5 rounded-2xl flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">You are registered!</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {hasSessions
                          ? 'You are signed up for all sessions of this event'
                          : 'You are signed up for this event'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hasSomeRegistrations && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-center p-4 rounded-2xl">
                        <p className="text-xs font-semibold">
                          ✓ Registered for {registeredSessionIds.length} session{registeredSessionIds.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">Register for remaining sessions below</p>
                      </div>
                    )}
                    
                    {isEventPast ? (
                      <div className="bg-muted border border-border text-muted-foreground text-center p-4 rounded-2xl space-y-1">
                        <p className="font-bold text-sm">Event Has Passed</p>
                        <p className="text-xs">Registration is closed for this event.</p>
                      </div>
                    ) : isFull ? (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive text-center p-4 rounded-2xl space-y-1">
                        <p className="font-bold text-sm">Fully Booked</p>
                        <p className="text-xs text-muted-foreground">All {event.capacity} spots have been reserved.</p>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full rounded-2xl py-6 h-auto font-bold text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 !bg-primary !text-white hover:opacity-90 border-none"
                        onClick={handleRegister}
                      >
                        {hasSomeRegistrations ? 'Register for More Sessions' : 'Register for Event'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Additional Info Box */}
                <div className="text-[11px] text-muted-foreground leading-relaxed text-center bg-muted/40 p-3 rounded-2xl border border-border/20">
                  <span className="font-semibold text-foreground block mb-0.5">Registration Information</span>
                  For questions or cancellations, please contact IIMC administration.
                </div>

              </CardContent>
            </Card>

          </div>

        </div>

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

              {/* Session Date Picker */}
              {hasSessions && isRecurring && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/30">
                  <SessionDatePicker
                    eventId={id!}
                    eventCapacity={event.capacity}
                    pricePerSession={event.price ?? 0}
                    onSelectionChange={handleSessionSelectionChange}
                    registeredSessionIds={registeredSessionIds}
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
                          className={cn(
                            "flex-1 text-xs h-8",
                            optionalDonation === amt && "!bg-primary !text-white hover:opacity-90 border-none"
                          )}
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
                className="flex-1 rounded-2xl py-3 h-auto font-semibold border border-border/40 hover:bg-muted/30 animate-none"
                onClick={() => setShowRegisterDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl py-3 h-auto font-bold !bg-primary !text-white hover:opacity-90 hover:!text-white shadow-md border-none"
                onClick={handleConfirmRegistration}
                disabled={!canProceed || isRegistering}
              >
                {isRegistering ? 'Registering...' :
                  isFreeEvent && optionalDonation === 0
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
