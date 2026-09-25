// ==============================================================================
// eGest MVP V1 - PRODUCTS SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore } from '@/lib/store';
import { Product, Category } from '@/types';

export const ProductsService = {
  async getCategories(organizationId: string): Promise<Category[]> {
    if (!isSupabaseConfigured) {
      return LocalStore.getCategories();
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createCategory(organizationId: string, name: string): Promise<Category> {
    if (!isSupabaseConfigured) {
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
      .insert({ organization_id: organizationId, name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProducts(organizationId: string): Promise<Product[]> {
    if (!isSupabaseConfigured) {
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
    if (error) throw error;
    return data || [];
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'category'>): Promise<Product> {
    if (!isSupabaseConfigured) {
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

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select(`*, category:categories(*)`)
      .single();
    if (error) throw error;

    if (product.stock_quantity > 0 && data) {
      await supabase.from('stock_movements').insert({
        organization_id: product.organization_id,
        product_id: data.id,
        type: 'IN',
        quantity: product.stock_quantity,
        note: 'Stock initial à la création',
      });
    }

    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured) {
      const products = LocalStore.getProducts();
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Produit introuvable');
      const updated = { ...products[idx], ...updates };
      products[idx] = updated;
      LocalStore.setProducts(products);
      return updated;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(`*, category:categories(*)`)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const products = LocalStore.getProducts().filter((p) => p.id !== id);
      LocalStore.setProducts(products);
      return;
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
};
