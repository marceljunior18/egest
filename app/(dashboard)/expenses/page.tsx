'use client';

// ==============================================================================
// eGest MVP V1 - MODULE DÉPENSES
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { ExpensesService } from '@/services/expenses';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '@/types';
import { formatFCFA, formatDate } from '@/lib/formatters';

export default function ExpensesPage() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { canManageExpenses } = usePermissions();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal Ajout/Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Formulaire Dépense
  const [formData, setFormData] = useState({
    amount: 0,
    category: 'Transport' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const orgId = organization?.id || 'org_pointe_noire_01';

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ExpensesService.getExpenses(orgId);
      setExpenses(data);
    } catch (err) {
      console.error('Erreur dépenses:', err);
      toast.error('Erreur chargement des dépenses');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Total du mois courant
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonthPrefix))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, currentMonthPrefix]);

  // Répartition par catégorie
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      amount: 0,
      category: 'Transport',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      amount: exp.amount,
      category: exp.category as ExpenseCategory,
      description: exp.description || '',
      date: exp.date,
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0 FCFA');
      return;
    }

    try {
      if (editingExpense) {
        await ExpensesService.updateExpense(editingExpense.id, formData);
        toast.success('Dépense mise à jour');
      } else {
        await ExpensesService.createExpense({
          organization_id: orgId,
          amount: formData.amount,
          category: formData.category,
          description: formData.description.trim() || undefined,
          date: formData.date,
          created_by: user?.id,
        });
        toast.success('Dépense enregistrée');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Erreur lors de l’enregistrement de la dépense');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await ExpensesService.deleteExpense(expenseToDelete.id);
      toast.success('Dépense supprimée');
      setExpenseToDelete(null);
      fetchData();
    } catch {
      toast.error('Impossible de supprimer la dépense');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Gestion des Dépenses & Charges
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enregistrez les charges courantes pour maîtriser la rentabilité de votre PME
          </p>
        </div>

        {canManageExpenses && (
          <Button variant="primary" size="md" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle Dépense
          </Button>
        )}
      </div>

      {/* Widget KPI & Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Total Mois */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Dépenses du Mois
            </CardTitle>
            <h3 className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">
              {formatFCFA(monthlyTotal)}
            </h3>
            <CardDescription className="mt-1">
              Charges décaissées sur le mois en cours
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Directement déduit du calcul de marge de votre Dashboard</span>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par Catégorie (2 colonnes) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1E40AF]" />
              Répartition par Poste de Charge
            </CardTitle>
            <CardDescription>Ventilation globale des dépenses enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune dépense enregistrée</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{cat.category}</span>
                      <span className="text-slate-500">
                        {formatFCFA(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#1E40AF] rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Rechercher par description ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="ALL">Toutes les catégories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des Dépenses */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune dépense enregistrée"
          description="Consignez les loyers, factures d'électricité E²C ou salaires."
          actionLabel={canManageExpenses ? 'Ajouter une dépense' : undefined}
          onAction={canManageExpenses ? handleOpenCreateModal : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Description / Détails</TableHead>
              <TableHead className="text-right">Montant Décaissé</TableHead>
              {canManageExpenses && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(exp.date)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{exp.category}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {exp.description || '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-black text-rose-600 dark:text-rose-400 text-xs">
                  -{formatFCFA(exp.amount)}
                </TableCell>
                {canManageExpenses && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(exp)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal Ajout / Édition Dépense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Modifier la dépense' : 'Enregistrer une Dépense'}
        description="Remplissez les détails du décaissement pour l'imputer à vos comptes."
        size="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input
            label="Montant (FCFA)"
            type="number"
            min="1"
            placeholder="Ex: 25000"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Catégorie de dépense
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Date du paiement"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Description / Justificatif
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Ex: Facture d'électricité boutique, achat fournitures bureau..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {editingExpense ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <Modal
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        title="Supprimer la dépense"
        description="Cette action retirera ce montant de vos charges comptabilisées."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Confirmez-vous la suppression de la dépense de{' '}
            <strong className="text-slate-900 dark:text-white">
              {formatFCFA(expenseToDelete?.amount)}
            </strong>{' '}
            ({expenseToDelete?.category}) ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
