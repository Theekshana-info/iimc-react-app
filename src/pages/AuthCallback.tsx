import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Confirm session from the OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          // No session — redirect to login
          navigate('/login', { replace: true });
          return;
        }

        const user = session.user;
        const providers = user.identities?.map((id) => id.provider) ?? [];

        // Fetch current profile to check auth_methods
        const { data: profile } = await supabase
          .from('profiles')
          .select('auth_methods')
          .eq('id', user.id)
          .single();

        if (profile) {
          const currentMethods = profile.auth_methods ?? [];
          const newMethods = [...new Set([...currentMethods, ...providers])];

          // Update auth_methods if there are new providers
          if (newMethods.length !== currentMethods.length) {
            await supabase
              .from('profiles')
              .update({
                auth_methods: newMethods,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }

          // Also update avatar_url from Google if not already set
          if (!profile.auth_methods?.includes('google') && providers.includes('google')) {
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
            if (avatarUrl) {
              await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id);
            }
          }
        }

        // Refresh profile in AuthContext
        await refreshProfile();

        // Redirect to home
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate, refreshProfile]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Authentication Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-sm text-primary hover:underline font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
