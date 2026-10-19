// ==============================================================================
// eGest V1.1 - UTILITAIRE D'EXPORT COMPTABLE (CSV / EXCEL UTF-8 AVEC BOM)
// ==============================================================================

import { Sale, Expense, Product } from '@/types';
import { formatDateTime } from '@/lib/formatters';

/**
 * Télécharge un fichier CSV formaté en UTF-8 avec BOM pour une compatibilité native Excel
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(';'),
    ...rows.map((row) => row.map(sanitize).join(';')),
  ].join('\r\n');

  // \uFEFF force Excel à ouvrir en UTF-8 avec tous les accents corrects
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export du journal des ventes pour la comptabilité
 */
export function exportSalesToCSV(sales: Sale[]) {
  const today = new Date().toISOString().split('T')[0];
  const headers = [
    'Numéro Vente',
    'Date & Heure',
    'Client',
    'Mode de Paiement',
    'Montant Total (FCFA)',
    'Articles vendus',
  ];

  const rows = sales.map((s) => {
    const itemsSummary = s.items
      ? s.items.map((it) => `${it.product?.name || 'Article'} (x${it.quantity})`).join(', ')
      : 'Vente directe';

    return [
      s.id,
      formatDateTime(s.created_at),
      s.customer_name || 'Client Comptoir',
      s.payment_method,
      s.total_amount,
      itemsSummary,
    ];
  });

  downloadCSV(`eGest_Journal_Ventes_${today}`, headers, rows);
}

/**
 * Export du grand livre des dépenses pour le suivi des charges
 */
export function exportExpensesToCSV(expenses: Expense[]) {
  const today = new Date().toISOString().split('T')[0];
  const headers = [
    'Référence',
    'Date',
    'Catégorie de Charge',
    'Montant (FCFA)',
    'Description / Justificatif',
  ];

  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.category,
    e.amount,
    e.description || '-',
  ]);

  downloadCSV(`eGest_Journal_Depenses_${today}`, headers, rows);
}

/**
 * Export de la valorisation et état du stock
 */
export function exportInventoryToCSV(products: Product[]) {
  const today = new Date().toISOString().split('T')[0];
  const headers = [
    'ID Produit',
    'Nom Article',
    'Code SKU / Code-Barres',
    'Catégorie',
    'Stock Actuel',
    'Seuil Alerte',
    'Prix Achat (FCFA)',
    'Prix Vente (FCFA)',
    'Valeur Stock Achat (FCFA)',
    'Valeur Stock Vente (FCFA)',
    'Statut Stock',
  ];

  const rows = products.map((p) => {
    const stockValPurchase = p.stock_quantity * p.purchase_price;
    const stockValSale = p.stock_quantity * p.selling_price;
    let status = 'Normal';
    if (p.stock_quantity <= 0) status = 'Rupture';
    else if (p.stock_quantity <= p.min_stock) status = 'Alerte Faible';

    return [
      p.id,
      p.name,
      p.sku || 'N/A',
      p.category?.name || 'Sans catégorie',
      p.stock_quantity,
      p.min_stock,
      p.purchase_price,
      p.selling_price,
      stockValPurchase,
      stockValSale,
      status,
    ];
  });

  downloadCSV(`eGest_Inventaire_Valorisation_${today}`, headers, rows);
}
