// ==============================================================================
// eGest MVP V1 - SALES SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Sale, SaleItem, PaymentMethod } from '@/types';

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
  items: CreateSaleItemParams[];
}

export const SalesService = {
  async getSales(organizationId: string): Promise<Sale[]> {
    if (!isSupabaseConfigured) {
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
    if (error) throw error;
    return data || [];
  },

  async createSale(params: CreateSaleParams): Promise<Sale> {
    const { organizationId, cashierId, customerName, paymentMethod, items } = params;

    if (!items || items.length === 0) {
      throw new Error('Une vente doit contenir au moins un article');
    }

    const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);

    if (!isSupabaseConfigured) {
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

    // Supabase
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        organization_id: organizationId,
        cashier_id: cashierId,
        customer_name: customerName?.trim() || null,
        payment_method: paymentMethod,
        total_amount: totalAmount,
      })
      .select()
      .single();
    if (saleErr) throw saleErr;

    // Items
    const itemsToInsert = items.map((it) => ({
      sale_id: sale.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.subtotal,
    }));

    const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert);
    if (itemsErr) throw itemsErr;

    // Déduction du stock si pas de trigger
    for (const it of items) {
      const { data: curProd } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', it.productId)
        .single();
      if (curProd) {
        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, curProd.stock_quantity - it.quantity) })
          .eq('id', it.productId);
      }
    }

    return sale;
  },
};
