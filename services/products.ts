// ==============================================================================
// eGest MVP V1 - PRODUCTS SERVICE (AVEC VALIDATION & SANITIZATION UUID)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Product, Category } from '@/types';
import { isValidUUID } from '@/lib/utils';

export const ProductsService = {
  async getCategories(organizationId: string): Promise<Category[]> {
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      return LocalStore.getCategories();
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) {
      console.warn('Erreur Supabase getCategories, repli local:', error.message);
      return LocalStore.getCategories();
    }
    return data || [];
  },

  async createCategory(organizationId: string, name: string): Promise<Category> {
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      const cats = LocalStore.getCategories();
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        organization_id: organizationId,
        name,
        created_at: new Date().toISOString(),
      };
      LocalStore.setCategories([...cats, newCat]);
      return newCat;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ organization_id: organizationId, name: name.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossible de créer la catégorie');
    return data;
  },

  async getProducts(organizationId: string): Promise<Product[]> {
    if (!isSupabaseConfigured || !isValidUUID(organizationId)) {
      return LocalStore.getProducts();
    }
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Erreur Supabase getProducts, repli local:', error.message);
      return LocalStore.getProducts();
    }
    return data || [];
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'category'>): Promise<Product> {
    if (!isSupabaseConfigured || !isValidUUID(product.organization_id)) {
      const products = LocalStore.getProducts();
      const newProd: Product = {
        ...product,
        id: `prod_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      LocalStore.setProducts([newProd, ...products]);

      // Si stock initial > 0, enregistrer un mouvement d'entrée
      if (product.stock_quantity > 0) {
        const movements = LocalStore.getStockMovements();
        movements.unshift({
          id: `mov_${Date.now()}`,
          organization_id: product.organization_id,
          product_id: newProd.id,
          type: 'IN',
          quantity: product.stock_quantity,
          note: 'Stock initial à la création',
          created_at: new Date().toISOString(),
        });
        LocalStore.setStockMovements(movements);
      }

      return newProd;
    }

    // Assainissement strict pour Supabase PostgreSQL
    const sanitizedPayload = {
      name: product.name.trim(),
      description: product.description?.trim() || null,
      sku: product.sku?.trim() || null,
      category_id: isValidUUID(product.category_id) ? product.category_id : null,
      purchase_price: Math.max(0, Number(product.purchase_price) || 0),
      selling_price: Math.max(0, Number(product.selling_price) || 0),
      stock_quantity: Math.max(0, Number(product.stock_quantity) || 0),
      min_stock: Math.max(0, Number(product.min_stock) || 0),
      image_url: product.image_url?.trim() || null,
      is_active: product.is_active ?? true,
      organization_id: product.organization_id,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(sanitizedPayload)
      .select(`*, category:categories(*)`)
      .single();

    if (error) {
      console.error('Erreur Supabase createProduct:', error);
      throw new Error(error.message || 'Erreur lors de la création du produit dans Supabase');
    }

    if (sanitizedPayload.stock_quantity > 0 && data) {
      try {
        await supabase.from('stock_movements').insert({
          organization_id: product.organization_id,
          product_id: data.id,
          type: 'IN',
          quantity: sanitizedPayload.stock_quantity,
          note: 'Stock initial à la création',
        });
      } catch (movErr) {
        console.warn('Avertissement mouvement stock initial:', movErr);
      }
    }

    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured || !isValidUUID(id)) {
      const products = LocalStore.getProducts();
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Produit introuvable');
      const updated = { ...products[idx], ...updates };
      products[idx] = updated;
      LocalStore.setProducts(products);
      return updated;
    }

    const sanitizedUpdates: Record<string, unknown> = { ...updates };
    if ('category_id' in updates) {
      sanitizedUpdates.category_id = isValidUUID(updates.category_id) ? updates.category_id : null;
    }
    if ('sku' in updates) {
      sanitizedUpdates.sku = updates.sku?.trim() || null;
    }
    if ('description' in updates) {
      sanitizedUpdates.description = updates.description?.trim() || null;
    }
    if ('purchase_price' in updates) {
      sanitizedUpdates.purchase_price = Number(updates.purchase_price) || 0;
    }
    if ('selling_price' in updates) {
      sanitizedUpdates.selling_price = Number(updates.selling_price) || 0;
    }
    if ('stock_quantity' in updates) {
      sanitizedUpdates.stock_quantity = Number(updates.stock_quantity) || 0;
    }
    if ('min_stock' in updates) {
      sanitizedUpdates.min_stock = Number(updates.min_stock) || 0;
    }

    const { data, error } = await supabase
      .from('products')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select(`*, category:categories(*)`)
      .single();

    if (error) {
      console.error('Erreur Supabase updateProduct:', error);
      throw new Error(error.message || 'Impossible de mettre à jour le produit');
    }
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured || !isValidUUID(id)) {
      const products = LocalStore.getProducts().filter((p) => p.id !== id);
      LocalStore.setProducts(products);
      return;
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Erreur Supabase deleteProduct:', error);
      throw new Error(error.message || 'Impossible de supprimer le produit');
    }
  },
};
