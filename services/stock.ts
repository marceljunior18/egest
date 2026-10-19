// ==============================================================================
// eGest MVP V1 - STOCK SERVICE (AVEC VALIDATION UUID & ASSAINISSEMENT)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { StockMovement, StockMovementType } from '@/types';
import { isValidUUID } from '@/lib/utils';

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
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
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
    if (error) {
      console.warn('Erreur Supabase getMovements, repli local:', error.message);
      return LocalStore.getStockMovements();
    }
    return data || [];
  },

  async recordMovement(params: RecordMovementParams): Promise<StockMovement> {
    const { organizationId, productId, type, quantity, note, createdBy } = params;

    if (!isSupabaseConfigured || !isValidUUID(organizationId) || !isValidUUID(productId)) {
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

    // Assainissement pour Supabase
    const sanitizedCreatedBy = isValidUUID(createdBy) ? createdBy : null;
    const sanitizedNote = note?.trim() || null;
    const sanitizedQty = Math.max(0, Number(quantity) || 0);

    const { data: movement, error: movError } = await supabase
      .from('stock_movements')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type,
        quantity: sanitizedQty,
        note: sanitizedNote,
        created_by: sanitizedCreatedBy,
      })
      .select()
      .single();

    if (movError) {
      console.error('Erreur Supabase recordMovement:', movError);
      throw new Error(movError.message || 'Impossible d’enregistrer le mouvement de stock');
    }

    // Mise à jour du stock dans la table products
    try {
      const { data: currentProd } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (currentProd) {
        let updatedStock = currentProd.stock_quantity;
        if (type === 'IN') updatedStock += sanitizedQty;
        else if (type === 'OUT') updatedStock = Math.max(0, updatedStock - sanitizedQty);
        else if (type === 'ADJUSTMENT') updatedStock = sanitizedQty;

        await supabase
          .from('products')
          .update({ stock_quantity: updatedStock })
          .eq('id', productId);
      }
    } catch (updateErr) {
      console.warn('Avertissement mise à jour stock produit:', updateErr);
    }

    return movement;
  },
};
