// ==============================================================================
// eGest MVP V1 - SALES SERVICE (AVEC VALIDATION UUID & GESTION ERREURS)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Sale, SaleItem, PaymentMethod } from '@/types';
import { isValidUUID } from '@/lib/utils';

export interface CreateSaleItemParams {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleParams {
  organizationId: string;
  cashierId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  totalAmount?: number;
  items: CreateSaleItemParams[];
}

export const SalesService = {
  async getSales(organizationId: string): Promise<Sale[]> {
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      return LocalStore.getSales();
    }
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name, sku, image_url)
        ),
        cashier:profiles(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Erreur Supabase getSales, repli local:', error.message);
      return LocalStore.getSales();
    }
    return data || [];
  },

  async createSale(params: CreateSaleParams): Promise<Sale> {
    const { organizationId, cashierId, customerName, paymentMethod, items } = params;

    if (!items || items.length === 0) {
      throw new Error('Une vente doit contenir au moins un article');
    }

    const totalAmount =
      params.totalAmount !== undefined
        ? params.totalAmount
        : items.reduce((sum, it) => sum + it.subtotal, 0);

    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      const saleId = `sal_${Date.now()}`;
      const products = LocalStore.getProducts();
      const movements = LocalStore.getStockMovements();

      // Vérifier et déduire le stock
      const saleItems: SaleItem[] = [];
      for (const item of items) {
        const pIdx = products.findIndex((p) => p.id === item.productId);
        if (pIdx !== -1) {
          products[pIdx].stock_quantity = Math.max(0, products[pIdx].stock_quantity - item.quantity);
          
          movements.unshift({
            id: `mov_${Date.now()}_${item.productId}`,
            organization_id: organizationId,
            product_id: item.productId,
            product: products[pIdx],
            type: 'OUT',
            quantity: item.quantity,
            note: `Vente #${saleId.substring(4, 10)} - ${customerName || 'Comptoir'}`,
            created_by: cashierId,
            created_at: new Date().toISOString(),
          });
        }

        saleItems.push({
          id: `item_${Date.now()}_${item.productId}`,
          sale_id: saleId,
          product_id: item.productId,
          product: pIdx !== -1 ? products[pIdx] : undefined,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        });
      }

      LocalStore.setProducts(products);
      LocalStore.setStockMovements(movements);

      const newSale: Sale = {
        id: saleId,
        organization_id: organizationId,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        customer_name: customerName?.trim() || undefined,
        cashier_id: cashierId,
        created_at: new Date().toISOString(),
        items: saleItems,
      };

      const sales = LocalStore.getSales();
      LocalStore.setSales([newSale, ...sales]);
      return newSale;
    }

    // Assainissement pour Supabase PostgreSQL
    const sanitizedCashierId = isValidUUID(cashierId) ? cashierId : null;
    const sanitizedCustomerName = customerName?.trim() || null;

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        organization_id: organizationId,
        cashier_id: sanitizedCashierId,
        customer_name: sanitizedCustomerName,
        payment_method: paymentMethod,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (saleErr) {
      console.error('Erreur Supabase insertion vente:', saleErr);
      throw new Error(saleErr.message || 'Impossible d’enregistrer la vente dans Supabase');
    }

    // Insertion des articles de vente
    const itemsToInsert = items.map((it) => ({
      sale_id: sale.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.subtotal,
    }));

    const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert);
    if (itemsErr) {
      console.error('Erreur Supabase insertion articles:', itemsErr);
      throw new Error(itemsErr.message || 'Erreur lors de l’enregistrement des articles vendus');
    }

    return sale;
  },
};
