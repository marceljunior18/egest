'use client';

// ==============================================================================
// eGest MVP V1 - useOrganization HOOK
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Organization, OrganizationMember, UserRole } from '@/types';
import { useAuth } from './useAuth';

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizationData = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      const org = LocalStore.getOrganization();
      const mems = LocalStore.getMembers();
      setOrganization(org);
      setMembers(mems);
      // Trouver le rôle de l'utilisateur actif
      const myMem = mems.find((m) => m.user_id === user?.id);
      setCurrentRole(myMem ? myMem.role : 'ADMIN');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Trouver l'organisation de l'utilisateur
      const { data: memberData, error: memErr } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (memErr && memErr.code !== 'PGRST116') {
        console.error('Erreur chargement organisation:', memErr);
      }

      if (memberData?.organization) {
        setOrganization(memberData.organization as unknown as Organization);
        setCurrentRole(memberData.role as UserRole);

        // Charger tous les membres de cette org
        const { data: allMembers } = await supabase
          .from('organization_members')
          .select('*, profile:profiles(*)')
          .eq('organization_id', memberData.organization_id);

        if (allMembers) {
          setMembers(allMembers as unknown as OrganizationMember[]);
        }
      }
    } catch (err) {
      console.error('Erreur organisation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return;
    if (!isSupabaseConfigured) {
      const updated = { ...organization, ...updates };
      LocalStore.setOrganization(updated);
      setOrganization(updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization.id)
      .select()
      .single();

    if (error) throw error;
    setOrganization(data);
    return data;
  };

  const createOrganization = async (data: {
    name: string;
    sector: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    currency?: string;
  }) => {
    if (!isSupabaseConfigured) {
      const newOrg: Organization = {
        id: `org_${Date.now()}`,
        name: data.name,
        sector: data.sector,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || 'Pointe-Noire',
        country: data.country || 'République du Congo',
        currency: data.currency || 'FCFA',
        owner_id: user?.id || 'usr_demo_admin_01',
        created_at: new Date().toISOString(),
      };
      LocalStore.setOrganization(newOrg);
      setOrganization(newOrg);

      const newMember: OrganizationMember = {
        id: `mem_${Date.now()}`,
        organization_id: newOrg.id,
        user_id: newOrg.owner_id,
        role: 'ADMIN',
        created_at: new Date().toISOString(),
      };
      LocalStore.setMembers([newMember]);
      setMembers([newMember]);
      setCurrentRole('ADMIN');
      return newOrg;
    }

    // Supabase
    if (!user) throw new Error('Utilisateur non connecté');

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        sector: data.sector,
        phone: data.phone,
        address: data.address,
        city: data.city || 'Pointe-Noire',
        country: data.country || 'Congo',
        currency: data.currency || 'FCFA',
        owner_id: user.id,
      })
      .select()
      .single();

    if (orgErr) throw orgErr;

    // Ajouter comme ADMIN
    const { error: memErr } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'ADMIN',
    });

    if (memErr) throw memErr;

    setOrganization(org);
    setCurrentRole('ADMIN');
    return org;
  };

  return {
    organization,
    members,
    currentRole,
    isLoading,
    refreshOrganization: fetchOrganizationData,
    updateOrganization,
    createOrganization,
  };
}
