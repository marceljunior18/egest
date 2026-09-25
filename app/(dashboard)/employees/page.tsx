'use client';

// ==============================================================================
// eGest MVP V1 - MODULE EMPLOYÉS & GESTION DES RÔLES
// Rôles : ADMIN | MANAGER | CASHIER | EMPLOYEE
// ==============================================================================

import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle,
  Mail,
  Edit2,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { LocalStore } from '@/lib/store';
import { OrganizationMember, UserRole } from '@/types';
import { formatRole } from '@/lib/formatters';

export default function EmployeesPage() {
  const { organization, members, refreshOrganization, isLoading } = useOrganization();
  const { user } = useAuth();
  const { canManageEmployees, isAdmin } = usePermissions();

  // Modal Inviter / Modifier Membre
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('CASHIER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal confirmation désactivation
  const [memberToDeactivate, setMemberToDeactivate] = useState<OrganizationMember | null>(null);

  const handleOpenInvite = () => {
    setEditingMember(null);
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('CASHIER');
    setIsInviteModalOpen(true);
  };

  const handleOpenEditRole = (member: OrganizationMember) => {
    setEditingMember(member);
    setInviteRole(member.role);
    setIsInviteModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMember) {
        // Mise à jour du rôle
        const currentMembers = LocalStore.getMembers();
        const updated = currentMembers.map((m) =>
          m.id === editingMember.id ? { ...m, role: inviteRole } : m
        );
        LocalStore.setMembers(updated);
        toast.success(`Le rôle a été modifié pour "${formatRole(inviteRole)}"`);
      } else {
        // Invitation d'un nouveau membre
        if (!inviteEmail.trim()) {
          toast.error('L’email est requis');
          setIsSubmitting(false);
          return;
        }

        const newMember: OrganizationMember = {
          id: `mem_${Date.now()}`,
          organization_id: organization?.id || 'org_pointe_noire_01',
          user_id: `usr_${Date.now()}`,
          role: inviteRole,
          created_at: new Date().toISOString(),
          profile: {
            id: `usr_${Date.now()}`,
            first_name: inviteFirstName.trim() || 'Collaborateur',
            last_name: inviteLastName.trim() || 'eGest',
            phone: '',
          },
        };

        const currentMembers = LocalStore.getMembers();
        LocalStore.setMembers([...currentMembers, newMember]);
        toast.success(`Invitation envoyée avec succès à ${inviteEmail}`);
      }

      setIsInviteModalOpen(false);
      refreshOrganization();
    } catch {
      toast.error('Erreur lors de l’opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateMember = async () => {
    if (!memberToDeactivate) return;
    try {
      const currentMembers = LocalStore.getMembers().filter((m) => m.id !== memberToDeactivate.id);
      LocalStore.setMembers(currentMembers);
      toast.success('Le collaborateur a été retiré de l’organisation');
      setMemberToDeactivate(null);
      refreshOrganization();
    } catch {
      toast.error('Impossible de retirer ce membre');
    }
  };

  const roleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'CASHIER':
        return 'success';
      case 'EMPLOYEE':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Équipe, Caissiers & Permissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez les accès de vos collaborateurs selon leur fonction dans l’entreprise
          </p>
        </div>

        {canManageEmployees && (
          <Button variant="primary" size="md" onClick={handleOpenInvite}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Inviter un Collaborateur
          </Button>
        )}
      </div>

      {/* Guide des Rôles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Badge variant="destructive" className="mb-2">ADMIN</Badge>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Accès Intégral</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Gestion des paramètres sensibles, suppression, finances et attribution des rôles.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Badge variant="default" className="mb-2">MANAGER</Badge>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Gestion Opérationnelle</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Gestion complète des produits, réapprovisionnement de stock, dépenses et caisse.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Badge variant="success" className="mb-2">CASHIER</Badge>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Caisse Uniquement</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Enregistrement des ventes comptoir, impression des reçus et consultation des prix.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Badge variant="secondary" className="mb-2">EMPLOYEE</Badge>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Lecture Seule</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Consultation du catalogue et des niveaux de stocks sans droit de modification.
          </p>
        </div>
      </div>

      {/* Tableau des Membres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Membres Actifs de l&apos;Organisation</CardTitle>
          <CardDescription>
            {members.length} collaborateur(s) autorisé(s) sur {organization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Rôle Système</TableHead>
                  <TableHead>Contact / Email</TableHead>
                  <TableHead>Statut</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isCurrentUser = member.user_id === user?.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                            {member.profile?.first_name ? member.profile.first_name[0] : 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {member.profile
                                ? `${member.profile.first_name} ${member.profile.last_name}`
                                : 'Utilisateur invité'}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-blue-100 text-[#1E40AF] px-1.5 py-0.2 rounded font-semibold dark:bg-blue-950 dark:text-blue-300">
                                  Vous
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Membre depuis {new Date(member.created_at || Date.now()).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {formatRole(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {member.profile?.phone || 'admin@egest-congo.cg'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Actif</span>
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditRole(member)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 transition-colors"
                              title="Modifier le rôle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isCurrentUser && (
                              <button
                                onClick={() => setMemberToDeactivate(member)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                                title="Désactiver"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Inviter / Modifier Rôle */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={editingMember ? 'Modifier le Rôle' : 'Inviter un Collaborateur'}
        description="Attribuez les permissions adéquates selon les missions confiées."
        size="md"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          {!editingMember && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  placeholder="Jean"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Nom"
                  placeholder="Bakala"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Adresse Email professionnelle"
                type="email"
                placeholder="jean.bakala@entreprise.cg"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                startIcon={<Mail className="w-4 h-4" />}
                required
              />
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Rôle attribué
            </label>
            <div className="space-y-2">
              {(
                [
                  { role: 'CASHIER', title: 'Caissier(ère)', desc: 'Accès uniquement au module Ventes / POS' },
                  { role: 'MANAGER', title: 'Manager / Gérant', desc: 'Gestion courante : produits, stocks, ventes et dépenses' },
                  { role: 'EMPLOYEE', title: 'Employé', desc: 'Consultation catalogue et stocks en lecture seule' },
                  { role: 'ADMIN', title: 'Administrateur', desc: 'Accès sans restriction' },
                ] as const
              ).map((item) => (
                <div
                  key={item.role}
                  onClick={() => setInviteRole(item.role)}
                  className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition-all ${
                    inviteRole === item.role
                      ? 'border-[#1E40AF] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40 ring-1 ring-[#1E40AF]'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    checked={inviteRole === item.role}
                    onChange={() => setInviteRole(item.role)}
                    className="mt-0.5 text-[#1E40AF]"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingMember ? 'Mettre à jour le rôle' : 'Envoyer l’invitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation Retrait Membre */}
      <Modal
        isOpen={Boolean(memberToDeactivate)}
        onClose={() => setMemberToDeactivate(null)}
        title="Désactiver le collaborateur"
        description="Cette personne perdra immédiatement l'accès à l'espace de votre entreprise."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Confirmez-vous le retrait de{' '}
            <strong className="text-slate-900 dark:text-white">
              {memberToDeactivate?.profile
                ? `${memberToDeactivate.profile.first_name} ${memberToDeactivate.profile.last_name}`
                : 'cet utilisateur'}
            </strong>{' '}
            de l’organisation ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMemberToDeactivate(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeactivateMember}>
              Confirmer la désactivation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
