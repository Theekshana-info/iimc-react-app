import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type PaymentStatus = 'polling' | 'success' | 'failed';

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const isPollingInitial = location.state?.isPolling;
  const paymentType = location.state?.paymentType;
  const eventId = location.state?.eventId;
  const donationId = location.state?.donationId;
  const paymentInitiatedAt = location.state?.paymentInitiatedAt;
  const attemptOrderId = location.state?.attemptOrderId;

  const [status, setStatus] = useState<PaymentStatus>(
    isPollingInitial ? 'polling' : 'failed'
  );
  
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 15;

  // Poll the database for the real payment status from webhook
  useEffect(() => {
    if (!isPollingInitial || status !== 'polling') return;

    const pollInterval = setInterval(async () => {
      setPollCount(prev => {
        if (prev >= MAX_POLLS) {
          clearInterval(pollInterval);
          // Polling timed out — payment was likely declined.
          // Update the pending attempt to 'failed' so admin sees it
          if (attemptOrderId) {
            supabase
              .from('payment_attempts')
              .update({ status: 'failed', failure_reason: 'Payment not confirmed after polling' })
              .eq('payhere_order_id', attemptOrderId)
              .eq('status', 'pending')
              .then(({ error }) => {
                if (error) console.error('Error updating attempt on timeout:', error);
                else console.log('Pending attempt marked as failed after timeout');
              });
          }
          setStatus('failed');
          return prev;
        }
        return prev + 1;
      });

      // For event registrations, check the payments table for THIS attempt only
      // Uses paymentInitiatedAt to filter out old successful records
      if (paymentType === 'event_registration' && eventId) {
        // Primary check: payments table (broad SELECT policy, always accessible)
        let query = supabase
          .from('payments')
          .select('status')
          .eq('related_id', eventId)
          .eq('payment_type', 'event_registration')
          .eq('status', 'completed');

        // Only match records created AFTER this payment was initiated
        if (paymentInitiatedAt) {
          query = query.gt('created_at', paymentInitiatedAt);
        }

        const { data: payment } = await query.maybeSingle();

        if (payment) {
          clearInterval(pollInterval);
          setStatus('success');
          return;
        }
      }

      // For donations, check if payment was created with 'completed' status
      if (paymentType === 'donation' && donationId) {
        let query = supabase
          .from('payments')
          .select('status')
          .eq('related_id', donationId)
          .eq('payment_type', 'donation')
          .eq('status', 'completed');

        if (paymentInitiatedAt) {
          query = query.gt('created_at', paymentInitiatedAt);
        }

        const { data: payment } = await query.maybeSingle();

        if (payment) {
          clearInterval(pollInterval);
          setStatus('success');
          return;
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isPollingInitial, status, paymentType, eventId, donationId, paymentInitiatedAt]);

  const isSuccess = status === 'success';
  const isPolling = status === 'polling';
  const isFailed = status === 'failed';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-glow text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isPolling ? (
              <div className="relative">
                <Clock className="h-16 w-16 text-yellow-500" />
                <Loader2 className="h-6 w-6 text-yellow-500 animate-spin absolute -bottom-1 -right-1" />
              </div>
            ) : isSuccess ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {isPolling
              ? 'Verifying Payment...'
              : isSuccess
              ? 'Payment Successful!'
              : 'Payment Not Confirmed'}
          </CardTitle>
          <CardDescription>
            {isPolling
              ? 'We are confirming your payment with PayHere. This may take a few moments.'
              : isSuccess
              ? 'Your payment has been verified and processed successfully.'
              : 'Your payment could not be confirmed. If you completed payment, it may take a few minutes to process.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPolling && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking payment status{pollCount > 0 ? ` (attempt ${pollCount}/${MAX_POLLS})` : '...'}</span>
            </div>
          )}

          {isSuccess && (
            <p className="text-sm text-muted-foreground">
              You will receive a confirmation email shortly.
            </p>
          )}

          {isFailed && (
            <p className="text-sm text-muted-foreground">
              If you believe payment was successful, please check back in a few minutes or contact support.
            </p>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
            {paymentType === 'event_registration' ? (
              <Button
                className="flex-1"
                onClick={() => navigate('/events')}
              >
                View Events
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
