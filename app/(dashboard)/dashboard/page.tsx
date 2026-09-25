'use client';

// ==============================================================================
// eGest MVP V1 - DASHBOARD PRINCIPAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrganization } from '@/hooks/useOrganization';
import { SalesService } from '@/services/sales';
import { ProductsService } from '@/services/products';
import { ExpensesService } from '@/services/expenses';
import { Sale, Product, Expense } from '@/types';
import { formatFCFA, formatDateTime } from '@/lib/formatters';

export default function DashboardPage() {
  const { organization } = useOrganization();
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('today');
  const [isLoading, setIsLoading] = useState(true);

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const orgId = organization?.id || 'org_pointe_noire_01';
      const [allSales, allProducts, allExpenses] = await Promise.all([
        SalesService.getSales(orgId),
        ProductsService.getProducts(orgId),
        ExpensesService.getExpenses(orgId),
      ]);
      setSales(allSales);
      setProducts(allProducts);
      setExpenses(allExpenses);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculs statistiques
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Ventes du jour
  const todaySales = sales.filter((s) => s.created_at.startsWith(todayStr));
  const revenueToday = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const salesCountToday = todaySales.length;

  // Dépenses du mois
  const monthlyExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  // Bénéfice estimé du mois (CA mois - Dépenses mois)
  const monthlySales = sales.filter((s) => s.created_at.startsWith(currentMonthStr));
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.total_amount, 0);
  const estimatedProfit = monthlyRevenue - monthlyExpenses;

  // 5 dernières ventes
  const recentSales = sales.slice(0, 5);

  // Produits en alerte stock faible
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.min_stock
  );

  // Données graphique 7 derniers jours
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d);

    const daySales = sales.filter((s) => s.created_at.startsWith(dayStr));
    const dayRevenue = daySales.reduce((sum, s) => sum + s.total_amount, 0);

    return {
      day: dayName.toUpperCase(),
      date: dayStr,
      revenue: dayRevenue,
    };
  });

  const maxRevenue = Math.max(...last7DaysData.map((d) => d.revenue), 50000);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Tableau de Bord
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aperçu des performances commerciales de votre établissement à Pointe-Noire
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setPeriod('today')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                period === 'today'
                  ? 'bg-white text-[#1E40AF] shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                period === '7days'
                  ? 'bg-white text-[#1E40AF] shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                period === '30days'
                  ? 'bg-white text-[#1E40AF] shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              30 jours
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} title="Rafraîchir les données">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Link href="/dashboard/sales?new=true">
            <Button size="sm" variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle Vente
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Chiffre d'Affaires du Jour"
            value={formatFCFA(revenueToday)}
            subtitle={`${salesCountToday} transaction(s) aujourd'hui`}
            icon={DollarSign}
            variant="blue"
          />
          <StatsCard
            title="Ventes Réalisées"
            value={`${salesCountToday}`}
            subtitle="Nombre de commandes comptoir"
            icon={ShoppingCart}
            variant="indigo"
          />
          <StatsCard
            title="Dépenses du Mois"
            value={formatFCFA(monthlyExpenses)}
            subtitle="Charges et décaissements"
            icon={Receipt}
            variant="amber"
          />
          <StatsCard
            title="Bénéfice Net Estimé"
            value={formatFCFA(estimatedProfit)}
            subtitle="Marge nette globale calculée"
            icon={TrendingUp}
            variant={estimatedProfit >= 0 ? 'emerald' : 'amber'}
          />
        </div>
      )}

      {/* Section Graphique & Alertes Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique Ventes 7 jours (2 colonnes) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Ventes des 7 derniers jours</CardTitle>
              <CardDescription>Activité quotidienne des encaissements en FCFA</CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-300">
              Total 7j : {formatFCFA(last7DaysData.reduce((a, b) => a + b.revenue, 0))}
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2">
              {last7DaysData.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
                const isToday = item.date === todayStr;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatFCFA(item.revenue)}
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                          isToday
                            ? 'bg-gradient-to-t from-[#1E40AF] to-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isToday ? 'text-[#1E40AF] dark:text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alertes Stock Faible (1 colonne) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Alertes Stock Faible
              </CardTitle>
              <CardDescription>Produits sous le seuil minimum configuré</CardDescription>
            </div>
            <Badge variant="warning">{lowStockProducts.length}</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aucun produit en rupture ou en stock faible. Tout est sous contrôle !
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        SKU: {p.sku || 'N/A'} • Seuil min: {p.min_stock}
                      </p>
                    </div>
                    <Badge variant={p.stock_quantity === 0 ? 'destructive' : 'warning'}>
                      {p.stock_quantity === 0 ? 'Rupture (0)' : `Reste : ${p.stock_quantity}`}
                    </Badge>
                  </div>
                ))}

                <Link href="/dashboard/inventory" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Gérer le réapprovisionnement
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5 Dernières Ventes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">5 Dernières Ventes</CardTitle>
            <CardDescription>Détail des dernières opérations passées en caisse</CardDescription>
          </div>
          <Link href="/dashboard/sales">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              Voir tout l’historique
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Aucune vente enregistrée"
              description="Commencez à encaisser vos clients pour voir vos statistiques grimper."
              actionLabel="Enregistrer une vente"
              onAction={() => (window.location.href = '/dashboard/sales?new=true')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf / Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode Paiement</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead className="text-right">Montant Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                        #{sale.id.substring(sale.id.length - 6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(sale.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
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
                      <span className="text-xs text-slate-500">
                        {sale.items?.length || 1} article(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                      {formatFCFA(sale.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
