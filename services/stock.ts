// ==============================================================================
// eGest MVP V1 - STOCK SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { StockMovement, StockMovementType } from '@/types';

export interface RecordMovementParams {
  organizationId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
  createdBy?: string;
}

export const StockService = {
  async getMovements(organizationId: string): Promise<StockMovement[]> {
    if (!isSupabaseConfigured) {
      return LocalStore.getStockMovements();
    }
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(name, sku, image_url)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async recordMovement(params: RecordMovementParams): Promise<StockMovement> {
    const { organizationId, productId, type, quantity, note, createdBy } = params;

    if (!isSupabaseConfigured) {
      const products = LocalStore.getProducts();
      const productIndex = products.findIndex((p) => p.id === productId);
      if (productIndex === -1) throw new Error('Produit non trouvé');

      const product = products[productIndex];
      let newStock = product.stock_quantity;

      if (type === 'IN') {
        newStock += quantity;
      } else if (type === 'OUT') {
        newStock = Math.max(0, newStock - quantity);
      } else if (type === 'ADJUSTMENT') {
        // En cas d'ajustement physique, la valeur saisie est le nouveau stock réel
        newStock = quantity;
      }

      products[productIndex] = {
        ...product,
        stock_quantity: newStock,
      };
      LocalStore.setProducts(products);

      const movements = LocalStore.getStockMovements();
      const newMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        organization_id: organizationId,
        product_id: productId,
        product: products[productIndex],
        type,
        quantity,
        note: note || '',
        created_by: createdBy,
        created_at: new Date().toISOString(),
      };

      LocalStore.setStockMovements([newMovement, ...movements]);
      return newMovement;
    }

    // Supabase : transactionnelle ou mise à jour directe
    const { data: movement, error: movError } = await supabase
      .from('stock_movements')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type,
        quantity,
        note,
        created_by: createdBy,
      })
      .select()
      .single();
    if (movError) throw movError;

    // Mise à jour du stock dans la table products
    const { data: currentProd } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (currentProd) {
      let updatedStock = currentProd.stock_quantity;
      if (type === 'IN') updatedStock += quantity;
      else if (type === 'OUT') updatedStock = Math.max(0, updatedStock - quantity);
      else if (type === 'ADJUSTMENT') updatedStock = quantity;

      await supabase
        .from('products')
        .update({ stock_quantity: updatedStock })
        .eq('id', productId);
    }

    return movement;
  },
};
