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
    // Get initial session
    const initializeAuth = async () => {
      console.log('[Auth] Initializing auth...');
      try {
        console.log('[Auth] Calling getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Auth] getSession result:', { session, error });
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[Auth] Calling fetchProfile from initializeAuth...');
          await fetchProfile(session.user.id);
          console.log('[Auth] fetchProfile finished from initializeAuth');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        console.log('[Auth] Setting loading to false from initializeAuth');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    console.log('[Auth] Setting up onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Auth] onAuthStateChange event triggered:', _event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[Auth] Calling fetchProfile from onAuthStateChange...');
          await fetchProfile(session.user.id);
          console.log('[Auth] fetchProfile finished from onAuthStateChange');
        } else {
          setProfile(null);
        }

        console.log('[Auth] Setting loading to false from onAuthStateChange');
        setLoading(false);
      }
    );

    return () => {
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
