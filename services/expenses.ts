// ==============================================================================
// eGest MVP V1 - EXPENSES SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Expense } from '@/types';

export const ExpensesService = {
  async getExpenses(organizationId: string): Promise<Expense[]> {
    if (!isSupabaseConfigured) {
      return LocalStore.getExpenses();
    }
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    if (!isSupabaseConfigured) {
      const expenses = LocalStore.getExpenses();
      const newExp: Expense = {
        ...expense,
        id: `exp_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      LocalStore.setExpenses([newExp, ...expenses]);
      return newExp;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    if (!isSupabaseConfigured) {
      const expenses = LocalStore.getExpenses();
      const idx = expenses.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Dépense non trouvée');
      const updated = { ...expenses[idx], ...updates };
      expenses[idx] = updated;
      LocalStore.setExpenses(expenses);
      return updated;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const expenses = LocalStore.getExpenses().filter((e) => e.id !== id);
      LocalStore.setExpenses(expenses);
      return;
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },
};
