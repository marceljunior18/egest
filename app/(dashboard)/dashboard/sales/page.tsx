'use client';

// ==============================================================================
// eGest MVP V1 - MODULE VENTES & CAISSE (POS)
// ==============================================================================

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Trash2,
  Receipt,
  User,
  CheckCircle2,
  Printer,
  Smartphone,
  Banknote,
  CreditCard,
  HelpCircle,
  Download,
  Barcode,
  Percent,
} from 'lucide-react';
import { exportSalesToCSV } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/ToastProvider';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { SalesService } from '@/services/sales';
import { ProductsService } from '@/services/products';
import { Sale, Product, PaymentMethod } from '@/types';
import { formatFCFA, formatDateTime } from '@/lib/formatters';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

function SalesContent() {
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { canCreateSale } = usePermissions();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recherche & Filtres liste
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Modal Nouvelle Vente (Caisse / POS)
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Espèces');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Modal Détail / Reçu Vente
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Recherche dans le sélecteur de produit de caisse
  const [productSearch, setProductSearch] = useState('');

  // Scanner Code-barres / Douchette
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // Remise commerciale
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Beep sonore caisse (Web Audio API natif)
  const playBeep = (success = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = success ? 'sine' : 'square';
      osc.frequency.setValueAtTime(success ? 880 : 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Ignorer si audio non autorisé
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeScanInput.trim().toLowerCase();
    if (!code) return;

    const matchedProduct = products.find(
      (p) =>
        p.is_active &&
        (p.sku?.toLowerCase() === code ||
          p.id.toLowerCase() === code ||
          p.name.toLowerCase() === code)
    );

    if (matchedProduct) {
      if (matchedProduct.stock_quantity <= 0) {
        playBeep(false);
        toast.error(`"${matchedProduct.name}" est en rupture de stock.`);
      } else {
        handleAddToCart(matchedProduct);
        playBeep(true);
        toast.success(`Scanné : ${matchedProduct.name} (+1)`);
      }
    } else {
      playBeep(false);
      toast.warning(`Aucun article trouvé pour le code : "${barcodeScanInput}"`);
    }

    setBarcodeScanInput('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const orgId = organization?.id;

  const fetchData = React.useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [allSales, allProducts] = await Promise.all([
        SalesService.getSales(orgId),
        ProductsService.getProducts(orgId),
      ]);
      setSales(allSales);
      setProducts(allProducts);
    } catch (err) {
      console.error('Erreur ventes:', err);
      toast.error('Erreur chargement des ventes');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Si l'URL contient ?new=true, ouvrir automatiquement la caisse
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsPosOpen(true);
    }
  }, [searchParams]);

  // Filtrage des ventes
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPayment = paymentFilter === 'ALL' || s.payment_method === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [sales, searchTerm, paymentFilter]);

  // Produits disponibles pour la caisse
  const availableProducts = useMemo(() => {
    return products
      .filter((p) => p.is_active && p.stock_quantity > 0)
      .filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
      );
  }, [products, productSearch]);

  // Gestion du panier
  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((it) => it.product.id === product.id);

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];
      if (existing.quantity + 1 > product.stock_quantity) {
        toast.warning(`Stock insuffisant : seulement ${product.stock_quantity} disponible(s)`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        subtotal: (existing.quantity + 1) * existing.unitPrice,
      };
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.selling_price,
          subtotal: product.selling_price,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stock_quantity) {
      toast.warning(`Stock disponible : ${product.stock_quantity} unités maximum`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const subtotalCartAmount = cart.reduce((acc, it) => acc + it.subtotal, 0);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'PERCENT') {
      return Math.round((subtotalCartAmount * Math.min(100, discountValue)) / 100);
    }
    return Math.min(subtotalCartAmount, discountValue);
  }, [subtotalCartAmount, discountType, discountValue]);

  const totalCartAmount = Math.max(0, subtotalCartAmount - discountAmount);

  const handleValidateSale = async () => {
    if (!orgId) {
      toast.error('Organisation non chargée. Veuillez patienter un instant...');
      return;
    }
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    setIsSubmittingSale(true);
    try {
      const created = await SalesService.createSale({
        organizationId: orgId,
        cashierId: user?.id,
        customerName: customerName.trim() || undefined,
        paymentMethod,
        totalAmount: totalCartAmount,
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
      });

      toast.success(`Vente de ${formatFCFA(totalCartAmount)} validée avec succès !`);
      setCart([]);
      setCustomerName('');
      setDiscountValue(0);
      setIsPosOpen(false);
      fetchData();

      // Proposer d'afficher le reçu
      setSelectedSaleForReceipt(created);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Erreur lors de la validation de la vente');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Journal des Ventes & Encaissements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historique des encaissements en caisse et point de vente en direct
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => exportSalesToCSV(filteredSales)}
            disabled={sales.length === 0}
            title="Exporter les ventes affichées au format Excel / CSV"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Exporter (Excel/CSV)
          </Button>

          {canCreateSale && (
            <Button
              variant="primary"
              size="md"
              className="shadow-sm shadow-blue-600/20"
              onClick={() => setIsPosOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle Vente (Caisse)
            </Button>
          )}
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Rechercher par référence ou nom client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="ALL">Tous les paiements</option>
            <option value="Espèces">Espèces</option>
            <option value="Mobile Money">Mobile Money (Airtel/MTN)</option>
            <option value="Carte">Carte Bancaire</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Tableau des Ventes */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aucune vente enregistrée"
          description="Enregistrez une vente pour démarrer le suivi de votre chiffre d'affaires."
          actionLabel={canCreateSale ? 'Nouvelle Vente' : undefined}
          onAction={canCreateSale ? () => setIsPosOpen(true) : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réf / Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Mode de Paiement</TableHead>
              <TableHead>Nombre d&apos;articles</TableHead>
              <TableHead>Caissier / Opérateur</TableHead>
              <TableHead className="text-right">Montant Total</TableHead>
              <TableHead className="text-right">Reçu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    #{sale.id.substring(sale.id.length - 6).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(sale.created_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {sale.customer_name || 'Client Comptoir'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sale.payment_method === 'Mobile Money'
                        ? 'warning'
                        : sale.payment_method === 'Espèces'
                        ? 'success'
                        : 'default'
                    }
                  >
                    {sale.payment_method}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {sale.items?.length || 1} article(s)
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {sale.cashier
                      ? `${sale.cashier.first_name} ${sale.cashier.last_name}`
                      : 'Caissier Principal'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-black text-xs text-slate-900 dark:text-white">
                  {formatFCFA(sale.total_amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 h-8 text-xs text-slate-500 hover:text-slate-900"
                    onClick={() => setSelectedSaleForReceipt(sale)}
                    title="Voir le reçu"
                  >
                    <Receipt className="w-4 h-4 mr-1 text-[#1E40AF]" />
                    Reçu
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal Point de Vente / Nouvelle Vente (POS) */}
      <Modal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        title="Point de Vente — Caisse Comptoir"
        description="Sélectionnez les articles, ajustez les quantités et validez l'encaissement."
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Colonne Gauche : Sélection Produits (7 colonnes) */}
          <div className="md:col-span-7 space-y-4 border-r border-slate-100 pr-0 md:pr-6 dark:border-slate-800">
            {/* Scanner Douchette Rapide */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="flex-1">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scanner code-barres / SKU + Entrée..."
                  value={barcodeScanInput}
                  onChange={(e) => setBarcodeScanInput(e.target.value)}
                  startIcon={<Barcode className="w-4 h-4 text-[#1E40AF]" />}
                  autoFocus
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="shrink-0 px-3">
                Scan
              </Button>
            </form>

            <Input
              placeholder="Ou chercher un article par son nom..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {availableProducts.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-xs text-slate-400">
                  Aucun produit disponible en stock avec ce nom.
                </div>
              ) : (
                availableProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="cursor-pointer rounded-xl border border-slate-200 p-3 hover:border-[#1E40AF] hover:bg-blue-50/30 transition-all dark:border-slate-800 dark:hover:bg-slate-800/40 text-left group"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#1E40AF]">
                        {p.name}
                      </p>
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {p.stock_quantity} dispo
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      SKU: {p.sku || 'Générique'}
                    </p>
                    <p className="mt-2 text-xs font-black text-[#1E40AF] dark:text-blue-400">
                      {formatFCFA(p.selling_price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne Droite : Panier & Encaissement (5 colonnes) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Panier en cours</span>
                <span className="text-[10px] text-slate-400">{cart.length} article(s)</span>
              </h4>

              {/* Items Panier */}
              <div className="max-h-[200px] overflow-y-auto space-y-2 mb-4">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl dark:border-slate-800">
                    Cliquez sur un article à gauche pour l&apos;ajouter au panier
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="overflow-hidden max-w-[130px]">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFCFA(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Remise Commerciale */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    Remise Commerciale
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        discountType === 'FIXED'
                          ? 'bg-[#1E40AF] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      FCFA
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        discountType === 'PERCENT'
                          ? 'bg-[#1E40AF] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'PERCENT' ? 100 : subtotalCartAmount}
                  value={discountValue === 0 ? '' : discountValue}
                  onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                  placeholder={
                    discountType === 'PERCENT'
                      ? 'Pourcentage (ex: 10 pour 10%)'
                      : 'Montant en FCFA (ex: 2000)'
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Client & Paiement */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Input
                  label="Nom du Client (optionnel)"
                  placeholder="Ex: M. Makosso, Cabinet..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  startIcon={<User className="w-4 h-4" />}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Mode de Règlement
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['Espèces', 'Mobile Money', 'Carte', 'Autre'] as PaymentMethod[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`p-2 rounded-lg border text-left font-bold flex items-center gap-1.5 transition-all ${
                          paymentMethod === mode
                            ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF] dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                        }`}
                      >
                        {mode === 'Espèces' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                        {mode === 'Mobile Money' && <Smartphone className="w-3.5 h-3.5 text-amber-600" />}
                        {mode === 'Carte' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                        {mode === 'Autre' && <HelpCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Total & Validation */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatFCFA(subtotalCartAmount)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Remise accordée :</span>
                  <span>- {formatFCFA(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 mb-2">
                <span className="text-xs font-bold text-slate-500">TOTAL NET À ENCAISSER</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatFCFA(totalCartAmount)}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-md"
                disabled={cart.length === 0 || isSubmittingSale}
                isLoading={isSubmittingSale}
                onClick={handleValidateSale}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider l&apos;encaissement
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Reçu de Caisse */}
      <Modal
        isOpen={Boolean(selectedSaleForReceipt)}
        onClose={() => setSelectedSaleForReceipt(null)}
        title="Reçu de Caisse Commercial"
        description="Ticket de vente officiel conforme eGest FCFA."
        size="sm"
      >
        {selectedSaleForReceipt && (
          <div className="space-y-4 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <p className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                {organization?.name || 'eGest PME'}
              </p>
              <p className="text-[10px] text-slate-500">
                {organization?.city || 'Pointe-Noire'} • {organization?.country || 'Congo'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Ticket #{selectedSaleForReceipt.id.substring(selectedSaleForReceipt.id.length - 8).toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatDateTime(selectedSaleForReceipt.created_at)}
              </p>
            </div>

            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Désignation</span>
                <span>Total</span>
              </div>
              {selectedSaleForReceipt.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="truncate max-w-[170px]">
                    {it.quantity}x {it.product?.name || 'Article'}
                  </span>
                  <span>{formatFCFA(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 font-bold">
              <div className="flex justify-between text-sm text-slate-900 dark:text-white">
                <span>TOTAL :</span>
                <span>{formatFCFA(selectedSaleForReceipt.total_amount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-normal">
                <span>Règlement :</span>
                <span>{selectedSaleForReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-normal">
                <span>Client :</span>
                <span>{selectedSaleForReceipt.customer_name || 'Comptoir'}</span>
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-slate-400">
              Merci de votre visite et à très bientôt !
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Imprimer le Reçu
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <SalesContent />
    </Suspense>
  );
}
