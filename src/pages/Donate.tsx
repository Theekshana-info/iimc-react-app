import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, CreditCard, Building2, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal } from '@/components/ScrollReveal';
import { cn } from '@/lib/utils';

export default function Donate() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');

  const predefinedAmounts = [500, 1000, 2500, 5000];

  const { data: bankDetails } = useQuery({
    queryKey: ['bank-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  const handleDonate = () => {
    const donationAmount = amount || customAmount;
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    // Monthly donations require login
    if (donationType === 'monthly') {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          toast.info('Please sign in to set up a monthly donation');
          navigate('/login', { state: { from: { pathname: '/donate' } } });
          return;
        }
        setShowDonorForm(true);
      });
      return;
    }

    setShowDonorForm(true);
  };

  const handleProceedToPayment = async () => {
    const donationAmount = amount || customAmount;
    try {
      if (donationType === 'monthly') {
        // Create subscription record, then go to payment
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to set up a monthly donation');
          navigate('/login', { state: { from: { pathname: '/donate' } } });
          return;
        }

        const subscriptionId = crypto.randomUUID();
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            id: subscriptionId,
            user_id: user.id,
            subscription_type: 'donation',
            price: parseFloat(donationAmount),
            amount: parseFloat(donationAmount),
            status: 'pending',
            billing_cycle: 'monthly',
            gateway: 'payhere',
            donor_message: donorMessage || null,
          });

        if (subError) throw subError;

        navigate('/payment', {
          state: {
            amount: parseFloat(donationAmount),
            type: 'subscription',
            description: 'Monthly Donation to IIMC',
            subscriptionId,
            isAnonymous: false,
          },
        });
      } else {
        // One-time donation (existing flow)
        const donationId = crypto.randomUUID();
        const { error: donationError } = await supabase
          .from('donations')
          .insert({
            id: donationId,
            amount: parseFloat(donationAmount),
            donor_name: donorName || null,
            donor_email: donorEmail || null,
            donor_message: donorMessage || null,
            status: 'pending',
          });

        if (donationError) throw donationError;

        navigate('/payment', {
          state: {
            amount: parseFloat(donationAmount),
            type: 'donation',
            description: 'Donation to IIMC',
            donationId: donationId,
            isAnonymous: true,
          },
        });
      }
    } catch (error) {
      toast.error('Failed to process donation');
    }
  };

  if (showDonorForm) {
    return (
      <div className="min-h-screen py-20 gradient-hero">
        <div className="container px-4 max-w-2xl">
          <ScrollReveal>
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {donationType === 'monthly' ? 'Set Up Monthly Donation' : 'Share Your Story (Optional)'}
                </CardTitle>
                <CardDescription>
                  {donationType === 'monthly'
                    ? 'Your monthly support makes a lasting impact. Review your details below.'
                    : 'Let us know who you are and why you\'re supporting us. All fields are optional.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex items-center justify-between">
                  <p className="text-lg font-semibold text-primary">
                    {donationType === 'monthly' ? 'Monthly' : ''} Donation: LKR {amount || customAmount}
                  </p>
                  {donationType === 'monthly' && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Recurring
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {donationType === 'one-time' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="donor-name">Your Name</Label>
                        <Input id="donor-name" placeholder="Enter your name (optional)" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="donor-email">Your Email</Label>
                        <Input id="donor-email" type="email" placeholder="Enter your email (optional)" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="donor-message">
                      {donationType === 'monthly' ? 'Message (Optional)' : 'Your Message'}
                    </Label>
                    <Textarea id="donor-message" placeholder="Share why you're supporting us (optional)" value={donorMessage} onChange={(e) => setDonorMessage(e.target.value)} rows={4} className="resize-none" />
                    <p className="text-xs text-muted-foreground">Your message will help us understand our community better.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 mb-1">
                  By proceeding, you agree to our{' '}
                  <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2">
                    Terms & Conditions
                  </Link>
                  . Payments are processed securely via PayHere.
                  {donationType === 'monthly' && ' You can cancel your subscription anytime from your profile.'}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDonorForm(false)} className="flex-1">Back</Button>
                  <Button onClick={handleProceedToPayment} className="flex-1" size="lg">
                    {donationType === 'monthly' ? 'Start Monthly Donation' : 'Continue to Payment'}
                  </Button>
                </div>
                {donationType === 'one-time' && (
                  <p className="text-center text-sm text-muted-foreground">You can skip this step and proceed directly to payment if you prefer to remain anonymous.</p>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4 max-w-4xl">
        <ScrollReveal>
          <div className="text-center mb-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-primary animate-breathe" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Support Our Mission</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your generous donation helps us maintain our meditation center and offer teachings to the community.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal direction="left" delay={100}>
            <Card className="shadow-glow h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Online Payment</CardTitle>
                </div>
                <CardDescription>Donate securely via PayHere payment gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Donation type toggle */}
                <div className="flex rounded-2xl bg-muted/40 p-1.5 border border-border/30">
                  <button
                    onClick={() => setDonationType('one-time')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300',
                      donationType === 'one-time'
                        ? '!bg-primary !text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}
                  >
                    <Zap className="h-4 w-4" />
                    One-time Donation
                  </button>
                  <button
                    onClick={() => setDonationType('monthly')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300',
                      donationType === 'monthly'
                        ? '!bg-primary !text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}
                  >
                    <RefreshCw className={cn("h-4 w-4", donationType === 'monthly' && "animate-spin-slow")} />
                    Monthly Subscription
                  </button>
                </div>

                {/* Visual Section Description */}
                {donationType === 'one-time' ? (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3 animate-fade-in-up">
                    <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-700 dark:text-amber-400">One-Time Contribution</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Your direct support will immediately assist center operations, program funding, and immediate repairs. No recurring billing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-primary-foreground text-xs flex items-start gap-3 animate-fade-in-up">
                    <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-spin-slow" />
                    <div className="space-y-1">
                      <p className="font-bold text-primary">Monthly Sponsorship</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Provide reliable, ongoing support to cover fixed expenses, sustain teachers, and expand programs. Managed easily via your profile.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {predefinedAmounts.map((value) => (
                    <Button
                      key={value}
                      variant={amount === value.toString() ? 'default' : 'outline'}
                      onClick={() => { setAmount(value.toString()); setCustomAmount(''); }}
                      className={cn(
                        "h-16 text-lg rounded-2xl transition-all duration-300 font-bold",
                        amount === value.toString()
                          ? "!bg-primary !text-white hover:opacity-90 shadow-md border-none"
                          : "border-border/50 hover:bg-muted/30"
                      )}
                    >
                      LKR {value.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Or enter a custom amount (LKR)</Label>
                  <Input
                    id="custom-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCustomAmount(val);
                      setAmount('');
                    }}
                  />
                </div>
                <Button 
                  className="w-full rounded-2xl py-6 h-auto font-bold text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 !bg-primary !text-white hover:opacity-90 border-none"
                  size="lg"
                  onClick={handleDonate}
                >
                  {donationType === 'monthly' ? 'Set Up Monthly Subscription' : 'Continue to Donation'}
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                  <p>Secure payment powered by PayHere</p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={200}>
            <Card className="shadow-glow h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Direct Bank Transfer</CardTitle>
                </div>
                <CardDescription>Transfer directly to our bank account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bankDetails && bankDetails.length > 0 ? (
                  bankDetails.map((bank) => (
                    <div key={bank.id} className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-muted-foreground">Bank Name</p><p className="font-semibold">{bank.bank_name}</p></div>
                        <div><p className="text-muted-foreground">Branch</p><p className="font-semibold">{bank.branch_name}</p></div>
                        <div><p className="text-muted-foreground">Account Number</p><p className="font-semibold font-mono">{bank.account_number}</p></div>
                        <div><p className="text-muted-foreground">Account Holder</p><p className="font-semibold">{bank.account_holder_name}</p></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground"><p>Bank details will be available soon</p></div>
                )}
                <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-md border border-primary/20">
                  <p className="font-semibold mb-1">After transferring:</p>
                  <p>Please email your receipt to our contact email with your name and any message you'd like to share.</p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <ScrollReveal delay={300}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Tax Deductible</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Donations to registered non-profit organizations may be tax-deductible.</p></CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Transparent Use</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">We ensure all donations are used responsibly for center operations and programs.</p></CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
