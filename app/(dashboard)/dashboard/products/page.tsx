'use client';

// ==============================================================================
// eGest MVP V1 - MODULE PRODUITS
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { ProductsService } from '@/services/products';
import { Product, Category } from '@/types';
import { formatFCFA } from '@/lib/formatters';

export default function ProductsPage() {
  const { organization } = useOrganization();
  const { canManageProducts } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal Ajout/Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal Catégorie
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal Confirmation Suppression
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Formulaire Produit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock: 5,
    image_url: '',
    is_active: true,
  });

  const orgId = organization?.id;

  const fetchData = React.useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        ProductsService.getProducts(orgId),
        ProductsService.getCategories(orgId),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Erreur produits:', err);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat =
        selectedCategory === 'ALL' || p.category_id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      min_stock: 5,
      image_url: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      sku: p.sku || '',
      category_id: p.category_id || '',
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      image_url: p.image_url || '',
      is_active: p.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error('Organisation non chargée. Veuillez patienter un instant...');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Le nom du produit est obligatoire');
      return;
    }
    if (formData.selling_price <= 0) {
      toast.error('Le prix de vente doit être supérieur à 0 FCFA');
      return;
    }

    try {
      if (editingProduct) {
        await ProductsService.updateProduct(editingProduct.id, {
          ...formData,
        });
        toast.success('Produit mis à jour avec succès');
      } else {
        await ProductsService.createProduct({
          ...formData,
          organization_id: orgId,
        });
        toast.success('Nouveau produit ajouté au catalogue');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Une erreur est survenue lors de l’enregistrement');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await ProductsService.deleteProduct(productToDelete.id);
      toast.success(`Le produit "${productToDelete.name}" a été supprimé`);
      setProductToDelete(null);
      fetchData();
    } catch {
      toast.error('Impossible de supprimer ce produit');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error('Organisation non chargée. Veuillez patienter un instant...');
      return;
    }
    if (!newCategoryName.trim()) return;
    try {
      const created = await ProductsService.createCategory(orgId, newCategoryName.trim());
      setCategories([...categories, created]);
      setFormData((prev) => ({ ...prev, category_id: created.id }));
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      toast.success('Catégorie ajoutée');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Erreur création catégorie');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Catalogue Produits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez votre inventaire, vos prix de vente et vos seuils d’alerte
          </p>
        </div>

        {canManageProducts && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <FolderPlus className="w-4 h-4 mr-1.5" />
              Nouvelle Catégorie
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter un Produit
            </Button>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Rechercher par nom ou référence SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit. Ajouter votre premier produit."
          description="Votre catalogue est actuellement vide pour ces critères de recherche."
          actionLabel={canManageProducts ? 'Ajouter un produit' : undefined}
          onAction={canManageProducts ? handleOpenCreateModal : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit / SKU</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix d&apos;achat</TableHead>
              <TableHead>Prix de vente</TableHead>
              <TableHead>Niveau de Stock</TableHead>
              <TableHead>Statut</TableHead>
              {canManageProducts && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const isLowStock = product.stock_quantity <= product.min_stock;
              const isOutOfStock = product.stock_quantity === 0;

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {product.name}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU : {product.sku || 'Non renseigné'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {product.category?.name || 'Général'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">
                      {formatFCFA(product.purchase_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatFCFA(product.selling_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{product.stock_quantity}</span>
                      {isOutOfStock ? (
                        <Badge variant="destructive">Rupture</Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3" />
                          Faible (&le; {product.min_stock})
                        </Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Actif' : 'Archivé'}
                    </Badge>
                  </TableCell>
                  {canManageProducts && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Modal Produit (Ajout / Édition) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Modifier le produit' : 'Nouveau Produit'}
        description="Remplissez les détails du produit pour l'enregistrer dans votre catalogue."
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nom du produit"
            placeholder="Ex: Écouteurs Bluetooth TWS"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Catégorie
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Référence interne (SKU)"
              placeholder="Ex: ELEC-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prix d'achat unitaire (FCFA)"
              type="number"
              min="0"
              value={formData.purchase_price || ''}
              onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
              helperText="Pour le calcul de votre marge brute"
            />
            <Input
              label="Prix de vente au client (FCFA)"
              type="number"
              min="0"
              value={formData.selling_price || ''}
              onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={editingProduct ? 'Stock Actuel' : 'Stock Initial'}
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
              required
            />
            <Input
              label="Seuil d'alerte stock minimum"
              type="number"
              min="1"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              helperText="Déclenche l'alerte stock faible"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Caractéristiques ou détails additionnels..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajout Catégorie */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nouvelle Catégorie"
        description="Créez une catégorie pour mieux regrouper vos articles."
        size="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Nom de la catégorie"
            placeholder="Ex: Boissons, Quincaillerie..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Créer la catégorie
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirmer la suppression"
        description="Cette action est irréversible et supprimera le produit de votre catalogue."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Êtes-vous certain de vouloir supprimer le produit{' '}
            <strong className="text-slate-900 dark:text-white">
              {productToDelete?.name}
            </strong>{' '}
            ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
