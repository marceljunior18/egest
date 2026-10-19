// ==============================================================================
// eGest MVP V1 - EXPENSES SERVICE (AVEC VALIDATION UUID & ASSAINISSEMENT)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Expense } from '@/types';
import { isValidUUID } from '@/lib/utils';

export const ExpensesService = {
  async getExpenses(organizationId: string): Promise<Expense[]> {
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      return LocalStore.getExpenses();
    }
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });
    if (error) {
      console.warn('Erreur Supabase getExpenses, repli local:', error.message);
      return LocalStore.getExpenses();
    }
    return data || [];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    if (!isSupabaseConfigured || !isValidUUID(expense.organization_id)) {
      const expenses = LocalStore.getExpenses();
      const newExp: Expense = {
        ...expense,
        id: `exp_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      LocalStore.setExpenses([newExp, ...expenses]);
      return newExp;
    }

    const sanitizedPayload = {
      organization_id: expense.organization_id,
      amount: Math.max(0, Number(expense.amount) || 0),
      category: expense.category,
      description: expense.description?.trim() || null,
      date: expense.date || new Date().toISOString().split('T')[0],
      created_by: isValidUUID(expense.created_by) ? expense.created_by : null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(sanitizedPayload)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase createExpense:', error);
      throw new Error(error.message || 'Impossible d’enregistrer la dépense dans Supabase');
    }
    return data;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    if (!isSupabaseConfigured || !isValidUUID(id)) {
      const expenses = LocalStore.getExpenses();
      const idx = expenses.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Dépense non trouvée');
      const updated = { ...expenses[idx], ...updates };
      expenses[idx] = updated;
      LocalStore.setExpenses(expenses);
      return updated;
    }

    const sanitizedUpdates: Record<string, unknown> = { ...updates };
    if ('created_by' in updates) {
      sanitizedUpdates.created_by = isValidUUID(updates.created_by) ? updates.created_by : null;
    }
    if ('amount' in updates) {
      sanitizedUpdates.amount = Number(updates.amount) || 0;
    }
    if ('description' in updates) {
      sanitizedUpdates.description = updates.description?.trim() || null;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase updateExpense:', error);
      throw new Error(error.message || 'Impossible de mettre à jour la dépense');
    }
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    if (!isSupabaseConfigured || !isValidUUID(id)) {
      const expenses = LocalStore.getExpenses().filter((e) => e.id !== id);
      LocalStore.setExpenses(expenses);
      return;
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Erreur Supabase deleteExpense:', error);
      throw new Error(error.message || 'Impossible de supprimer la dépense');
    }
  },
};
