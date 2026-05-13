// HIGH-9: Email verification banner — shown on all pages for unverified users
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Only show to logged-in users with unverified email
  if (!user || user.email_confirmed_at || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setSending(false);
    if (error) toast.error('Failed to send verification email.');
    else toast.success('Verification email sent! Check your inbox.');
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950/30 border-b border-yellow-200 dark:border-yellow-800 relative z-50">
      <div className="container px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Your email is not verified. Some features like payments are restricted.</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-yellow-400 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Verify Now'}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
