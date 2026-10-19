'use client';

// ==============================================================================
// eGest MVP V1 - MODULE STOCK & INVENTAIRE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  AlertTriangle,
  History,
  Download,
} from 'lucide-react';
import { exportInventoryToCSV } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { ProductsService } from '@/services/products';
import { StockService } from '@/services/stock';
import { Product, StockMovement, StockMovementType } from '@/types';
import { formatDateTime } from '@/lib/formatters';

export default function InventoryPage() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { canManageInventory } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Mouvement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orgId = organization?.id;

  const fetchData = React.useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [prods, movs] = await Promise.all([
        ProductsService.getProducts(orgId),
        StockService.getMovements(orgId),
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch (err) {
      console.error('Erreur inventaire:', err);
      toast.error('Erreur lors du chargement des stocks');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenMovementModal = (type: StockMovementType, product?: Product) => {
    setMovementType(type);
    setSelectedProduct(product || (products.length > 0 ? products[0] : null));
    setQuantity(type === 'ADJUSTMENT' && product ? product.stock_quantity : 1);
    setNote('');
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error('Organisation non chargée. Veuillez patienter un instant...');
      return;
    }
    if (!selectedProduct) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    if (quantity < 0) {
      toast.error('La quantité ne peut pas être négative');
      return;
    }

    setIsSubmitting(true);
    try {
      await StockService.recordMovement({
        organizationId: orgId,
        productId: selectedProduct.id,
        type: movementType,
        quantity,
        note: note.trim() || undefined,
        createdBy: user?.id,
      });

      toast.success(
        movementType === 'IN'
          ? `Entrée de stock enregistrée (+${quantity})`
          : movementType === 'OUT'
          ? `Sortie de stock enregistrée (-${quantity})`
          : `Stock physique ajusté à ${quantity}`
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Erreur lors de l’enregistrement du mouvement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Niveaux de stocks stats
  const totalItems = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Gestion du Stock & Inventaire
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Contrôlez les flux d’approvisionnement, sorties et ajustements physiques
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportInventoryToCSV(products)}
            disabled={products.length === 0}
            title="Exporter la valorisation du stock au format Excel / CSV"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Exporter (Excel/CSV)
          </Button>

          {canManageInventory && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMovementModal('ADJUSTMENT')}
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                Ajustement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMovementModal('OUT')}
              >
                <ArrowDownLeft className="w-4 h-4 mr-1.5 text-rose-500" />
                Sortie / Perte
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenMovementModal('IN')}
              >
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                Entrée de Stock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Résumé des indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Quantité totale en rayon
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {totalItems} unités
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Stock Faible (Seuil atteint)
            </p>
            <h3 className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-300">
              {lowStockCount} référence(s)
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
              Ruptures de stock
            </p>
            <h3 className="mt-1 text-2xl font-black text-rose-900 dark:text-rose-300">
              {outOfStockCount} référence(s)
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tableau État des Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Niveau de Stock par Produit</CardTitle>
          <CardDescription>
            Indicateur visuel automatique : OK (Vert) / Faible (Orange) / Rupture (Rouge)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Aucun produit dans l'inventaire"
              description="Ajoutez des produits pour commencer le suivi de votre stock."
              actionLabel="Créer un produit"
              onAction={() => (window.location.href = '/dashboard/products')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit / SKU</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Seuil Minimum</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>État du Stock</TableHead>
                  {canManageInventory && <TableHead className="text-right">Actions Rapides</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isLow = product.stock_quantity <= product.min_stock && product.stock_quantity > 0;
                  const isOut = product.stock_quantity === 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {product.name}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {product.sku || 'Sans SKU'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {product.category?.name || 'Général'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {product.min_stock} unités
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="destructive">Rupture</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Faible</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                      {canManageInventory && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleOpenMovementModal('IN', product)}
                            >
                              + Entrée
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-rose-600"
                              onClick={() => handleOpenMovementModal('OUT', product)}
                            >
                              - Sortie
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historique des Mouvements de Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Historique Récent des Mouvements
          </CardTitle>
          <CardDescription>
            Traçabilité complète des entrées, sorties et ajustements avec motif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Aucun mouvement de stock enregistré pour le moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Heure</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type de flux</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Motif / Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 10).map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {formatDateTime(mov.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {mov.product?.name || 'Produit'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {mov.type === 'IN' ? (
                        <Badge variant="success">Entrée (+)</Badge>
                      ) : mov.type === 'OUT' ? (
                        <Badge variant="destructive">Sortie (-)</Badge>
                      ) : (
                        <Badge variant="default">Ajustement</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs">
                        {mov.type === 'IN' ? `+${mov.quantity}` : mov.type === 'OUT' ? `-${mov.quantity}` : mov.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {mov.note || '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Mouvement de Stock */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          movementType === 'IN'
            ? 'Entrée de Stock (Réapprovisionnement)'
            : movementType === 'OUT'
            ? 'Sortie de Stock (Perte / Avarie / Retour)'
            : 'Ajustement Physique (Inventaire)'
        }
        description="Ce mouvement mettra immédiatement à jour le niveau de stock en temps réel."
        size="md"
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Sélectionner le Produit
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find((prod) => prod.id === e.target.value);
                setSelectedProduct(p || null);
                if (movementType === 'ADJUSTMENT' && p) {
                  setQuantity(p.stock_quantity);
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock actuel : {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <Input
            label={
              movementType === 'ADJUSTMENT'
                ? 'Nouveau stock réel compté (Unités)'
                : 'Quantité à ajouter/déduire (Unités)'
            }
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Motif / Note explicative
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder={
                movementType === 'IN'
                  ? 'Ex: Livraison fournisseur BL-992'
                  : movementType === 'OUT'
                  ? 'Ex: Produit endommagé pendant transport'
                  : 'Ex: Comptage physique mensuel'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Enregistrer le mouvement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
