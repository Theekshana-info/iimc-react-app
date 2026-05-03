import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { amount, type, relatedId, description, isAnonymous, donationId } = location.state || {};

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If anonymous donation, skip auth check
      if (isAnonymous && type === 'donation') {
        setUser({ id: 'anonymous' } as any);
        return;
      }

      if (!user) {
        navigate('/auth', { state: { from: { pathname: '/payment' } } });
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
      const returnUrl = `${window.location.origin}/payment-result?success=true`;
      const cancelUrl = `${window.location.origin}/payment-result?success=false`;
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payhere_webhook_handler`;

      // Call edge function to create PayHere order
      const { data, error } = await supabase.functions.invoke('create_payhere_order', {
        body: {
          amount,
          orderId,
          itemName: description || type,
          returnUrl,
          cancelUrl,
          notifyUrl,
        },
      });

      if (error) throw error;

      // Create payment record
      const { data: paymentData } = await supabase.from('payments').insert({
        user_id: user.id !== 'anonymous' ? user.id : null,
        amount,
        payment_type: type,
        related_id: relatedId,
        related_type: type,
        status: 'pending',
      }).select().single();

      // Update donation with payment_id if this is a donation
      if (donationId && paymentData) {
        await supabase
          .from('donations')
          .update({ payment_id: paymentData.id })
          .eq('id', donationId);
      }

      // Create PayHere form and submit
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payhere.lk/pay/checkout';

      const fields = {
        merchant_id: data.merchant_id,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        order_id: data.order_id,
        items: data.items,
        currency: data.currency,
        amount: data.amount,
        first_name: user.id === 'anonymous' ? 'Donor' : (user.user_metadata?.full_name?.split(' ')[0] || 'User'),
        last_name: user.id === 'anonymous' ? '' : (user.user_metadata?.full_name?.split(' ')[1] || ''),
        email: user.id === 'anonymous' ? 'donor@anonymous.com' : user.email,
        phone: '',
        address: '',
        city: '',
        country: 'Sri Lanka',
        hash: data.hash,
        custom_1: relatedId ? `${type}:${relatedId}` : type,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
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
            You will be redirected to PayHere to complete your payment
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
            Proceed to PayHere
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by PayHere
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
