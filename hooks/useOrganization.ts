'use client';

// ==============================================================================
// eGest MVP V1 - useOrganization HOOK (AUTO-RÉSOLUTION & PROVISIONING RÉSILIENT)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Organization, OrganizationMember, UserRole } from '@/types';
import { useAuth } from './useAuth';
import { isValidUUID } from '@/lib/utils';

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizationData = useCallback(async () => {
    setIsLoading(true);

    // 1. Mode Local pur si Supabase n'est pas configuré
    if (!isSupabaseConfigured) {
      const org = LocalStore.getOrganization();
      const mems = LocalStore.getMembers();
      setOrganization(org);
      setMembers(mems);
      const myMem = mems.find((m) => m.user_id === user?.id);
      setCurrentRole(myMem ? myMem.role : 'ADMIN');
      setIsLoading(false);
      return;
    }

    // 2. Si pas d'utilisateur authentifié Supabase
    if (!user || !isValidUUID(user.id)) {
      const localOrg = LocalStore.getOrganization();
      setOrganization(localOrg);
      setCurrentRole('ADMIN');
      setIsLoading(false);
      return;
    }

    // 3. Utilisateur authentifié dans Supabase
    try {
      // Rechercher l'organisation rattachée dans organization_members
      const { data: memberData, error: memErr } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (memErr && memErr.code !== 'PGRST116') {
        console.warn('Vérification organisation membre:', memErr.message);
      }

      if (memberData?.organization) {
        const org = memberData.organization as unknown as Organization;
        setOrganization(org);
        setCurrentRole(memberData.role as UserRole);

        // Charger tous les membres de cette org
        const { data: allMembers } = await supabase
          .from('organization_members')
          .select('*, profile:profiles(*)')
          .eq('organization_id', memberData.organization_id);

        if (allMembers) {
          setMembers(allMembers as unknown as OrganizationMember[]);
        }
        setIsLoading(false);
        return;
      }

      // Si aucun lien trouvé dans organization_members, vérifier si l'utilisateur possède déjà une organisation
      const { data: ownedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ownedOrg) {
        // Réassocier l'organisation_members si manquant
        await supabase.from('organization_members').upsert({
          organization_id: ownedOrg.id,
          user_id: user.id,
          role: 'ADMIN',
        });

        setOrganization(ownedOrg as unknown as Organization);
        setCurrentRole('ADMIN');
        setIsLoading(false);
        return;
      }

      // 4. AUTO-PROVISIONING : L'utilisateur est connecté mais n'a pas encore d'entreprise créée
      // On crée automatiquement son entreprise par défaut pour garantir un organization_id UUID valide
      console.log('Auto-provisioning de l’organisation eGest pour l’utilisateur:', user.id);
      const { data: newOrg, error: createOrgErr } = await supabase
        .from('organizations')
        .insert({
          name: 'Boutique Élite Pointe-Noire',
          sector: 'Boutique',
          city: 'Pointe-Noire',
          country: 'Congo',
          currency: 'FCFA',
          owner_id: user.id,
        })
        .select()
        .single();

      if (!createOrgErr && newOrg) {
        await supabase.from('organization_members').insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'ADMIN',
        });

        setOrganization(newOrg as unknown as Organization);
        setCurrentRole('ADMIN');
      } else {
        // En cas d'erreur RLS, repli local
        console.warn('Repli organisation locale:', createOrgErr?.message);
        setOrganization(LocalStore.getOrganization());
      }
    } catch (err) {
      console.error('Erreur organisation, repli sécurisé:', err);
      setOrganization(LocalStore.getOrganization());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return;
    if (!isSupabaseConfigured || !isValidUUID(organization.id)) {
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

    if (error) throw new Error(error.message || 'Impossible de mettre à jour l’entreprise');
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
    if (!isSupabaseConfigured || !user || !isValidUUID(user.id)) {
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

    if (orgErr) throw new Error(orgErr.message || 'Erreur lors de la création de l’entreprise');

    // Ajouter comme ADMIN
    const { error: memErr } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'ADMIN',
    });

    if (memErr) {
      console.warn('Erreur ajout membre:', memErr);
    }

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
