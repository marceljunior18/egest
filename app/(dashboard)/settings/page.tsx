'use client';

// ==============================================================================
// eGest MVP V1 - MODULE PARAMÈTRES (PROFIL & ENTREPRISE)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Lock,
  Phone,
  MapPin,
  Coins,
  Save,
  Shield,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { LocalStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRole } from '@/lib/formatters';

export default function SettingsPage() {
  const { organization, updateOrganization, currentRole } = useOrganization();
  const { profile } = useAuth();
  const { isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security'>('profile');

  // Formulaire Profil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Formulaire Entreprise
  const [companyData, setCompanyData] = useState({
    name: '',
    sector: '',
    phone: '',
    address: '',
    city: 'Pointe-Noire',
    country: 'République du Congo',
    currency: 'FCFA',
  });

  // Formulaire Mot de passe
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (organization) {
      setCompanyData({
        name: organization.name || '',
        sector: organization.sector || 'Boutique',
        phone: organization.phone || '',
        address: organization.address || '',
        city: organization.city || 'Pointe-Noire',
        country: organization.country || 'République du Congo',
        currency: organization.currency || 'FCFA',
      });
    }
  }, [organization]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (profile) {
        const updated = {
          ...profile,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
        };
        LocalStore.setProfile(updated);

        if (isSupabaseConfigured) {
          await supabase
            .from('profiles')
            .update({
              first_name: profileData.firstName,
              last_name: profileData.lastName,
              phone: profileData.phone,
            })
            .eq('id', profile.id);
        }
      }
      toast.success('Votre profil a été mis à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Seul un Administrateur peut modifier les coordonnées de l’entreprise');
      return;
    }

    setIsSavingOrg(true);
    try {
      await updateOrganization(companyData);
      toast.success('Paramètres de l’entreprise enregistrés');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSavingPassword(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword,
        });
        if (error) throw error;
      }
      toast.success('Mot de passe changé avec succès');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Paramètres du Système
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gérez votre identité, votre sécurité et la fiche signalétique de votre entreprise
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#1E40AF] text-[#1E40AF] dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Utilisateur</span>
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'organization'
              ? 'border-[#1E40AF] text-[#1E40AF] dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Fiche Entreprise</span>
          {!isAdmin && <Badge variant="secondary" className="text-[9px]">Lecture</Badge>}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[#1E40AF] text-[#1E40AF] dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Sécurité & Mot de passe</span>
        </button>
      </div>

      {/* Tab: Profil */}
      {activeTab === 'profile' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Informations Personnelles</CardTitle>
            <CardDescription>
              Ces coordonnées vous identifient sur les reçus de caisse et rapports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#1E40AF] font-black text-xl uppercase dark:bg-blue-900/60 dark:text-blue-300">
                  {profileData.firstName ? profileData.firstName[0] : 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {profileData.firstName} {profileData.lastName}
                  </h4>
                  <Badge variant="default" className="mt-1">
                    {formatRole(currentRole)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Nom"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Numéro de téléphone"
                type="tel"
                placeholder="+242 06 000 00 00"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                startIcon={<Phone className="w-4 h-4" />}
              />

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                  <Save className="w-4 h-4 mr-1.5" />
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Entreprise */}
      {activeTab === 'organization' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Identité de l&apos;Entreprise</CardTitle>
                <CardDescription>
                  Configuration générale, devise FCFA et localisation à Pointe-Noire
                </CardDescription>
              </div>
              {!isAdmin && (
                <Badge variant="warning">
                  Modification réservée aux Administrateurs
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <Input
                label="Nom commercial de l'établissement"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                disabled={!isAdmin}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Secteur d&apos;activité
                  </label>
                  <select
                    value={companyData.sector}
                    onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
                  >
                    <option value="Boutique">Boutique / Commerce</option>
                    <option value="Restaurant">Restaurant / Bar</option>
                    <option value="Pharmacie">Pharmacie / Dépôt</option>
                    <option value="Autre">Autre Entreprise</option>
                  </select>
                </div>

                <Input
                  label="Téléphone professionnel"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  disabled={!isAdmin}
                  startIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Adresse physique / Quartier"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                disabled={!isAdmin}
                startIcon={<MapPin className="w-4 h-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Ville"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  disabled={!isAdmin}
                />
                <Input
                  label="Pays"
                  value={companyData.country}
                  disabled
                />
                <Input
                  label="Devise principale"
                  value={companyData.currency}
                  disabled
                  startIcon={<Coins className="w-4 h-4" />}
                />
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button type="submit" variant="primary" isLoading={isSavingOrg}>
                    <Save className="w-4 h-4 mr-1.5" />
                    Mettre à jour l&apos;entreprise
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Sécurité */}
      {activeTab === 'security' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Sécurité du Compte</CardTitle>
            <CardDescription>
              Modifiez votre mot de passe pour protéger les données de votre établissement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••••••"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                startIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                placeholder="••••••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                startIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" variant="primary" isLoading={isSavingPassword}>
                  <Shield className="w-4 h-4 mr-1.5" />
                  Mettre à jour le mot de passe
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
