'use client';

// ==============================================================================
// eGest MVP V1 - useAuth HOOK
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadLocalUser = useCallback(() => {
    const p = LocalStore.getProfile();
    setProfile(p);
    setUser({
      id: p.id,
      email: 'admin@egest-congo.cg',
      profile: p,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadLocalUser();
      return;
    }

    // Supabase Auth listener
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const activeProfile = prof || {
            id: session.user.id,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            phone: session.user.user_metadata?.phone || '',
          };

          setProfile(activeProfile);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            profile: activeProfile,
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Erreur vérification session auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const activeProfile = prof || {
          id: session.user.id,
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          phone: session.user.user_metadata?.phone || '',
        };

        setProfile(activeProfile);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          profile: activeProfile,
        });
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadLocalUser]);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      // Local login simulation
      loadLocalUser();
      router.push('/dashboard');
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setIsLoading(false);
    if (!error) {
      router.push('/dashboard');
    }
    return { error };
  };

  const signUp = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      // Local registration
      const newProfile: Profile = {
        id: `usr_${Date.now()}`,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        created_at: new Date().toISOString(),
      };
      LocalStore.setProfile(newProfile);
      setProfile(newProfile);
      setUser({
        id: newProfile.id,
        email: data.email,
        profile: newProfile,
      });
      setIsLoading(false);
      router.push('/onboarding');
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
        },
      },
    });
    setIsLoading(false);
    if (!error) {
      router.push('/onboarding');
    }
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  return {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
