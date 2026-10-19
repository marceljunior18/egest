'use client';

// ==============================================================================
// eGest MVP V1 - useAuth HOOK (AVEC GESTION DEMO INTELLIGENTE & SUPABASE)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';
import { isValidUUID } from '@/lib/utils';

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
            .maybeSingle();

          const activeProfile: Profile = prof || {
            id: session.user.id,
            first_name: session.user.user_metadata?.first_name || 'Responsable',
            last_name: session.user.user_metadata?.last_name || 'eGest',
            phone: session.user.user_metadata?.phone || '+242 06 000 00 00',
            avatar_url: '',
            created_at: new Date().toISOString(),
          };

          setProfile(activeProfile);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            profile: activeProfile,
          });
        } else {
          // Aucun utilisateur connecté
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
          .maybeSingle();

        const activeProfile: Profile = prof || {
          id: session.user.id,
          first_name: session.user.user_metadata?.first_name || 'Responsable',
          last_name: session.user.user_metadata?.last_name || 'eGest',
          phone: session.user.user_metadata?.phone || '+242 06 000 00 00',
          avatar_url: '',
          created_at: new Date().toISOString(),
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
      loadLocalUser();
      router.push('/dashboard');
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    setIsLoading(false);
    if (!error) {
      router.push('/dashboard');
    }
    return { error };
  };

  const signInDemo = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      loadLocalUser();
      router.push('/dashboard');
      return { error: null };
    }

    const demoEmail = 'admin@egest-congo.cg';
    const demoPass = 'demo-congo-2026';

    // 1. Tenter la connexion avec le compte démo Supabase
    let { data: signData, error: signError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPass,
    });

    // 2. Si non existant, créer le compte démo sur Supabase
    if (signError && (signError.message.toLowerCase().includes('invalid') || signError.status === 400)) {
      const { error: upError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: {
            first_name: 'Christian',
            last_name: 'Mavoungou',
            phone: '+242 06 612 34 56',
          },
        },
      });

      if (!upError) {
        const retry = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPass,
        });
        signError = retry.error;
      }
    }

    setIsLoading(false);
    if (!signError) {
      router.push('/dashboard');
      return { error: null };
    }

    // Fallback gracieux en mode local si besoin
    console.warn('Repli local démo:', signError?.message);
    loadLocalUser();
    router.push('/dashboard');
    return { error: null };
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

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          phone: data.phone.trim(),
        },
      },
    });

    // Si session active immédiatement (sans confirmation email requise)
    if (!error && authData.session) {
      setIsLoading(false);
      router.push('/onboarding');
      return { error: null };
    }

    // Si inscription réussie mais nécessite login
    if (!error && authData.user) {
      const loginAttempt = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      setIsLoading(false);
      if (!loginAttempt.error) {
        router.push('/onboarding');
        return { error: null };
      }
    }

    setIsLoading(false);
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
    signInDemo,
    signUp,
    signOut,
  };
}
