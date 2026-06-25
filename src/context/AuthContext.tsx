import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  location: string | null;
  theme: string | null;
  has_password: boolean | null;
  auth_methods: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Setting up AuthContext...');

    const syncAdminSession = async (token: string, userId: string) => {
      try {
        // Sync local client cookie
        document.cookie = `sb-access-token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;

        // Check if user has administrator role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (roles) {
          console.log('[Auth] Admin role detected. Requesting bypass session...');
          const res = await fetch('/api/maintenance/admin-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (res.ok) {
            console.log('[Auth] Admin bypass session established successfully.');
            if (window.location.pathname === '/maintenance') {
              const urlParams = new URLSearchParams(window.location.search);
              const redirectTo = urlParams.get('redirect') || '/';
              window.location.href = redirectTo;
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Failed to sync admin session:', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('[Auth] Auth event:', event);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[Auth] Fetching profile for session (non-blocking)...');
          
          // Non-blocking sync for admin bypass cookie
          syncAdminSession(session.access_token, session.user.id);

          // CRITICAL: Do NOT await fetchProfile here!
          // Supabase internally awaits this callback while holding a lock.
          // If we await a Supabase query here, the query waits for the lock,
          // causing an infinite deadlock!
          fetchProfile(session.user.id).finally(() => {
            if (mounted) {
              console.log('[Auth] Setting loading to false after profile fetch');
              setLoading(false);
            }
          });
        } else {
          setProfile(null);
          // Clear client cookies
          document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
          console.log('[Auth] Setting loading to false (no session)');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
