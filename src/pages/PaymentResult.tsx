import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    // Could add analytics tracking here
  }, [success]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-glow text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {success ? 'Payment Successful!' : 'Payment Cancelled'}
          </CardTitle>
          <CardDescription>
            {success
              ? 'Your payment has been processed successfully.'
              : 'Your payment was cancelled or failed to process.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <p className="text-sm text-muted-foreground">
              You will receive a confirmation email shortly.
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
