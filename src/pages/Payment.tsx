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
      const { data: { user } } = await supabase.auth.getUser();
      
      // If anonymous donation, skip auth check
      if (isAnonymous && type === 'donation') {
        setUser({ id: 'anonymous' } as any);
        return;
      }

      if (!user) {
        navigate('/login', { state: { from: { pathname: '/payment' } } });
        return;
      }

      setUser(user);
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
      const actualUserId = user.id === 'anonymous' ? null : user.id;

      // Call edge function to create PayHere order (generates hash server-side)
      // Also logs a pending payment attempt
      const { data, error } = await supabase.functions.invoke('create_payhere_order', {
        body: {
          amount,
          orderId,
          itemName: description || type,
          notifyUrl,
          userId: actualUserId,
          paymentType: type,
          eventId: type === 'event_registration' ? eventId : null,
          donationId: type === 'donation' ? donationId : null,
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
          state: { paymentType: type, eventId, donationId, isPolling: true, paymentInitiatedAt },
        });
      };

      payhere.onDismissed = function onDismissed() {
        console.log('Payment dismissed by user');
        toast.error('Payment was cancelled. You can try again.');
        setLoading(false);
      };

      payhere.onError = function onError(error: string) {
        console.error('PayHere error:', error);
        toast.error('Payment error: ' + error);
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
