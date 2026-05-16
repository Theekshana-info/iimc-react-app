import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { amount, type, eventId, description, isAnonymous, donationId } = location.state || {};

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // If anonymous donation and no user logged in, allow it
      if (isAnonymous && type === 'donation') {
        setUser(authUser || { id: 'anonymous' } as any);
        return;
      }

      if (!authUser) {
        navigate('/login', { state: { from: { pathname: '/payment' } } });
        return;
      }

      setUser(authUser);
    };

    checkAuth();

    if (!amount || !type) {
      toast.error('Invalid payment details');
      navigate('/');
    }
  }, [navigate, amount, type, isAnonymous]);

  // HIGH-9: Check if email is verified (anonymous donors are exempt)
  const isAuthenticated = user && user.id !== 'anonymous';
  const isEmailVerified = !isAuthenticated || !!user?.email_confirmed_at;

  const handlePayment = async () => {
    if (!user) return;

    // HIGH-9: Block payment for unverified authenticated users
    if (isAuthenticated && !user.email_confirmed_at) {
      toast.error('Please verify your email address before making a payment.', {
        description: 'Check your inbox for a verification link, or click "Verify Now" in the banner above.',
        duration: 6000,
      });
      return;
    }

    setLoading(true);

    try {
      const orderId = `${type}_${Date.now()}`;
      const actualUserId = user.id === 'anonymous' ? null : user.id;

      // ─── Log pending payment attempt to DB (admin can see it immediately) ───
      try {
        const { error: attemptError } = await supabase
          .from('payment_attempts')
          .insert({
            user_id: actualUserId,
            type: type,
            event_id: type === 'event_registration' ? eventId : null,
            amount: parseFloat(amount),
            currency: 'LKR',
            status: 'pending',
            payhere_order_id: orderId,
            donation_id: type === 'donation' ? donationId : null,
          });

        if (attemptError) {
          console.error('Error logging pending payment attempt:', attemptError);
        } else {
          console.log('Pending payment attempt logged with orderId:', orderId);
        }
      } catch (e) {
        console.error('Failed to log payment attempt:', e);
      }

      // Call edge function to create PayHere order (generates hash server-side)
      // Send ALL fields for backward compat with old deployed function + new fields for when it's redeployed
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payhere_webhook_handler`;
      const { data, error } = await supabase.functions.invoke('create_payhere_order', {
        body: {
          amount,
          orderId,
          itemName: description || type,
          notifyUrl,
          // New fields for when edge function is redeployed (HIGH-1)
          type,
          eventId: type === 'event_registration' ? eventId : undefined,
        },
      });

      console.log('create_payhere_order response', { data, error });

      if (error) throw error;
      if (!data) throw new Error('No data received from edge function');

      // Record when payment was initiated so polling only finds records from THIS attempt
      const paymentInitiatedAt = new Date().toISOString();

      // Set up event handlers BEFORE starting payment
      payhere.onCompleted = function onCompleted(completedOrderId: string) {
        console.log('Payment completed. OrderID:', completedOrderId);
        navigate('/payment-result', {
          state: {
            paymentType: type, eventId, donationId,
            isPolling: true, paymentInitiatedAt,
            attemptOrderId: orderId, attemptUserId: actualUserId,
          },
        });
      };

      payhere.onDismissed = function onDismissed() {
        console.log('Payment dismissed by user');
        supabase
          .from('payment_attempts')
          .update({ status: 'cancelled', failure_reason: 'User dismissed payment popup' })
          .eq('payhere_order_id', orderId)
          .then(({ error }) => {
            if (error) console.error('Error updating attempt to cancelled:', error);
            else console.log('Payment attempt updated to cancelled');
          });
        toast.error('Payment was cancelled. You can try again.');
        setLoading(false);
      };

      payhere.onError = function onError(errorMsg: string) {
        console.error('PayHere error:', errorMsg);
        supabase
          .from('payment_attempts')
          .update({ status: 'failed', failure_reason: errorMsg || 'PayHere SDK error' })
          .eq('payhere_order_id', orderId)
          .then(({ error }) => {
            if (error) console.error('Error updating attempt to failed:', error);
            else console.log('Payment attempt updated to failed');
          });
        toast.error('Payment error: ' + errorMsg);
        setLoading(false);
      };

      // Build custom_1 for webhook
      let custom1 = type;
      if (type === 'event_registration' && eventId) {
        custom1 = `event_registration:${eventId}`;
      } else if (type === 'donation' && donationId) {
        custom1 = `donation:${donationId}`;
      }

      const items = data.items || description || type || 'Payment';
      const amountValue = data.amount || amount;

      const missingFields: string[] = [];
      if (!data.merchant_id) missingFields.push('merchant_id');
      if (!data.order_id) missingFields.push('order_id');
      if (!amountValue) missingFields.push('amount');
      if (!data.currency) missingFields.push('currency');
      if (!data.hash) missingFields.push('hash');

      if (missingFields.length > 0) {
        throw new Error(`Invalid PayHere data received from edge function (missing: ${missingFields.join(', ')})`);
      }

      // Build the payment object for the JS SDK
      const payment = {
        // CRITICAL-2: Environment-controlled sandbox mode
        sandbox: import.meta.env.VITE_PAYHERE_SANDBOX === 'true',
        merchant_id: data.merchant_id,
        return_url: `${window.location.origin}/payment-result`,
        cancel_url: `${window.location.origin}/payment`,
        notify_url: data.notify_url,
        order_id: data.order_id,
        items,
        amount: String(amountValue),
        currency: data.currency,
        hash: data.hash,
        first_name: user.id === 'anonymous' ? 'Donor' : (user.user_metadata?.full_name?.split(' ')[0] || 'User'),
        last_name: user.id === 'anonymous' ? '' : (user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''),
        email: user.id === 'anonymous' ? 'donor@anonymous.com' : user.email,
        phone: user.user_metadata?.phone || '0000000000',
        address: 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka',
        custom_1: custom1,
        custom_2: actualUserId || '',
      };

      payhere.startPayment(payment);

    } catch (error) {
      console.error('Payment error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast.error(message);
      setLoading(false);
    }
  };

  if (!user || !amount) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Pay securely via PayHere — the payment form will open as a popup on this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium">{description || type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="text-2xl font-bold">LKR {amount}</span>
            </div>
          </div>

          {/* HIGH-9: Email verification gate */}
          {!isEmailVerified && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>You must verify your email address before making a payment.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs border-yellow-400"
                onClick={async () => {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: user.email!,
                    options: { emailRedirectTo: `${window.location.origin}/login` },
                  });
                  if (error) toast.error('Failed to send verification email.');
                  else toast.success('Verification email sent! Check your inbox.');
                }}
              >
                Resend Verification Email
              </Button>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={loading || !isEmailVerified}
          >
            {!isEmailVerified
              ? 'Verify Email to Pay'
              : loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                : 'Pay with PayHere'}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <p>Secure payment powered by PayHere</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}