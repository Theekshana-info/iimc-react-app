import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

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
        // Still use the real auth user if logged in (for payment attempt tracking)
        // Only fall back to 'anonymous' if truly not logged in
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

  const handlePayment = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const orderId = `${type}_${Date.now()}`;
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payhere_webhook_handler`;
      // Use the real user ID for payment logging, null only if truly anonymous (no auth session)
      const actualUserId = user.id === 'anonymous' ? null : user.id;

      // ─── Log pending payment attempt to DB (admin can see it immediately) ───
      // NOTE: We do NOT use .select() because there's no SELECT policy for regular users.
      // Instead, we use orderId (payhere_order_id) to match the record for later updates.
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
      const { data, error } = await supabase.functions.invoke('create_payhere_order', {
        body: {
          amount,
          orderId,
          itemName: description || type,
          notifyUrl,
        },
      });

      if (error) throw error;

      // ─── PayHere JS SDK: Onsite Checkout Popup ───
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
        // Update the payment attempt to 'cancelled' using orderId as the match key
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
        // Update the payment attempt to 'failed' using orderId as the match key
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

      if (!data) throw new Error('No data received from edge function');

      // Build custom_1: "type:eventId" for event registrations, "donation:donationId" for donations
      let custom1 = type;
      if (type === 'event_registration' && eventId) {
        custom1 = `event_registration:${eventId}`;
      } else if (type === 'donation' && donationId) {
        custom1 = `donation:${donationId}`;
      }

      // Build the payment object for the JS SDK
      const payment = {
        sandbox: true, // Sandbox mode for testing
        merchant_id: data.merchant_id,
        return_url: undefined,
        cancel_url: undefined,
        notify_url: data.notify_url,
        order_id: data.order_id,
        items: data.items,
        amount: data.amount,
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

      // Open the PayHere payment popup
      payhere.startPayment(payment);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
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

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Processing...' : 'Pay with PayHere'}
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
