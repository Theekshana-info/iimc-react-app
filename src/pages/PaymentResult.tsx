import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type PaymentStatus = 'polling' | 'completed' | 'pending' | 'failed' | 'canceled' | 'unknown';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // From JS SDK flow (via navigate state)
  const stateOrderId = location.state?.orderId;
  const statePaymentId = location.state?.paymentId;

  // From legacy redirect flow (via URL params)
  const urlSuccess = searchParams.get('success');

  const [status, setStatus] = useState<PaymentStatus>(
    statePaymentId ? 'polling' : (urlSuccess === 'true' ? 'completed' : urlSuccess === 'false' ? 'failed' : 'unknown')
  );
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 10;

  // Poll the database for the real payment status from webhook
  useEffect(() => {
    if (!statePaymentId || status !== 'polling') return;

    const pollInterval = setInterval(async () => {
      setPollCount(prev => {
        if (prev >= MAX_POLLS) {
          clearInterval(pollInterval);
          // After max polls, check one last time and show whatever we have
          setStatus('pending');
          return prev;
        }
        return prev + 1;
      });

      const { data, error } = await supabase
        .from('payments')
        .select('status')
        .eq('id', statePaymentId)
        .single();

      if (error) {
        console.error('Error polling payment status:', error);
        return;
      }

      if (data?.status && data.status !== 'pending') {
        clearInterval(pollInterval);
        setStatus(data.status as PaymentStatus);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [statePaymentId, status]);

  const isSuccess = status === 'completed';
  const isPending = status === 'polling' || status === 'pending';
  const isFailed = status === 'failed' || status === 'canceled';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-glow text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isPending ? (
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
            {isPending
              ? 'Verifying Payment...'
              : isSuccess
              ? 'Payment Successful!'
              : 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {isPending
              ? 'We are confirming your payment with PayHere. This may take a few moments.'
              : isSuccess
              ? 'Your payment has been verified and processed successfully.'
              : 'Your payment was cancelled or could not be processed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && (
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

          {status === 'pending' && pollCount >= MAX_POLLS && (
            <p className="text-sm text-muted-foreground">
              Your payment is being processed. It may take a few minutes to confirm. Please check your activities page for the updated status.
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
            <Button
              className="flex-1"
              onClick={() => navigate('/activities')}
            >
              View Activities
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
