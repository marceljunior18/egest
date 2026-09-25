// ==============================================================================
// eGest MVP V1 - LOCAL DATA STORE (HYBRID SUPABASE / LOCAL PERSISTENCE)
// Permet une expérience fluide immédiate tout en étant 100% prêt pour Supabase
// ==============================================================================

import {
  Organization,
  Profile,
  OrganizationMember,
  Category,
  Product,
  StockMovement,
  Sale,
  Expense,
  DashboardStats,
} from '@/types';

const STORAGE_KEYS = {
  CURRENT_USER: 'egest_current_user',
  ORGANIZATION: 'egest_organization',
  MEMBERS: 'egest_members',
  CATEGORIES: 'egest_categories',
  PRODUCTS: 'egest_products',
  STOCK_MOVEMENTS: 'egest_stock_movements',
  SALES: 'egest_sales',
  EXPENSES: 'egest_expenses',
};

// Données initiales réalistes (Marché Pointe-Noire, Congo - FCFA)
const INITIAL_PROFILE: Profile = {
  id: 'usr_demo_admin_01',
  first_name: 'Christian',
  last_name: 'Mavoungou',
  phone: '+242 06 612 34 56',
  avatar_url: '',
  created_at: new Date().toISOString(),
};

const INITIAL_ORGANIZATION: Organization = {
  id: 'org_pointe_noire_01',
  name: 'Boutique Élite Pointe-Noire',
  sector: 'Boutique',
  phone: '+242 05 555 78 90',
  address: 'Avenue Moe Pratt, Centre-ville',
  city: 'Pointe-Noire',
  country: 'République du Congo',
  currency: 'FCFA',
  owner_id: 'usr_demo_admin_01',
  created_at: new Date().toISOString(),
};

const INITIAL_MEMBERS: OrganizationMember[] = [
  {
    id: 'mem_01',
    organization_id: 'org_pointe_noire_01',
    user_id: 'usr_demo_admin_01',
    role: 'ADMIN',
    created_at: new Date().toISOString(),
    profile: INITIAL_PROFILE,
  },
  {
    id: 'mem_02',
    organization_id: 'org_pointe_noire_01',
    user_id: 'usr_demo_cashier_02',
    role: 'CASHIER',
    created_at: new Date().toISOString(),
    profile: {
      id: 'usr_demo_cashier_02',
      first_name: 'Awa',
      last_name: 'Kouassi',
      phone: '+242 06 432 10 98',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mem_03',
    organization_id: 'org_pointe_noire_01',
    user_id: 'usr_demo_mgr_03',
    role: 'MANAGER',
    created_at: new Date().toISOString(),
    profile: {
      id: 'usr_demo_mgr_03',
      first_name: 'Serge',
      last_name: 'Ngoma',
      phone: '+242 05 600 22 11',
      created_at: new Date().toISOString(),
    },
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_01', organization_id: 'org_pointe_noire_01', name: 'Électronique & Accessoires' },
  { id: 'cat_02', organization_id: 'org_pointe_noire_01', name: 'Mode & Habillement' },
  { id: 'cat_03', organization_id: 'org_pointe_noire_01', name: 'Alimentation & Boissons' },
  { id: 'cat_04', organization_id: 'org_pointe_noire_01', name: 'Hygiène & Beauté' },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_01',
    organization_id: 'org_pointe_noire_01',
    name: 'Écouteurs Bluetooth Pro TWS',
    sku: 'ELEC-TWS-01',
    category_id: 'cat_01',
    purchase_price: 9000,
    selling_price: 16500,
    stock_quantity: 18,
    min_stock: 5,
    is_active: true,
    description: 'Écouteurs sans fil avec réduction active du bruit',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'prod_02',
    organization_id: 'org_pointe_noire_01',
    name: 'Chargeur Rapide 65W USB-C',
    sku: 'ELEC-CHG-65W',
    category_id: 'cat_01',
    purchase_price: 7500,
    selling_price: 13000,
    stock_quantity: 3, // Seuil faible ! (<= min_stock 5)
    min_stock: 5,
    is_active: true,
    description: 'Chargeur universel GaN ultra-rapide',
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 'prod_03',
    organization_id: 'org_pointe_noire_01',
    name: 'Chemise Homme Coton Égypte',
    sku: 'MOD-CHM-01',
    category_id: 'cat_02',
    purchase_price: 12000,
    selling_price: 22000,
    stock_quantity: 14,
    min_stock: 4,
    is_active: true,
    description: 'Chemise habillée coupe slim moderne',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'prod_04',
    organization_id: 'org_pointe_noire_01',
    name: 'Montre Quartz Chrono Élégance',
    sku: 'MOD-WTC-01',
    category_id: 'cat_02',
    purchase_price: 18000,
    selling_price: 35000,
    stock_quantity: 2, // Seuil faible !
    min_stock: 3,
    is_active: true,
    description: 'Boîtier acier inoxydable résistant à l’eau',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'prod_05',
    organization_id: 'org_pointe_noire_01',
    name: 'Pack Eau Minérale Mayombe 1.5L (x6)',
    sku: 'ALIM-EAU-01',
    category_id: 'cat_03',
    purchase_price: 2400,
    selling_price: 3600,
    stock_quantity: 35,
    min_stock: 10,
    is_active: true,
    description: 'Eau de source naturelle purifiée',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'prod_06',
    organization_id: 'org_pointe_noire_01',
    name: 'Café Pur Arabica Moulu 250g',
    sku: 'ALIM-CAF-01',
    category_id: 'cat_03',
    purchase_price: 3200,
    selling_price: 5500,
    stock_quantity: 0, // Rupture de stock !
    min_stock: 5,
    is_active: true,
    description: 'Café torréfié artisanalement au Congo',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sal_01',
    organization_id: 'org_pointe_noire_01',
    total_amount: 33000,
    payment_method: 'Mobile Money',
    customer_name: 'Jean-Paul Samba',
    cashier_id: 'usr_demo_admin_01',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      { id: 'item_01', sale_id: 'sal_01', product_id: 'prod_01', quantity: 2, unit_price: 16500, subtotal: 33000 },
    ],
  },
  {
    id: 'sal_02',
    organization_id: 'org_pointe_noire_01',
    total_amount: 35000,
    payment_method: 'Espèces',
    customer_name: 'Cabinet Mpassi',
    cashier_id: 'usr_demo_admin_01',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    items: [
      { id: 'item_02', sale_id: 'sal_02', product_id: 'prod_04', quantity: 1, unit_price: 35000, subtotal: 35000 },
    ],
  },
  {
    id: 'sal_03',
    organization_id: 'org_pointe_noire_01',
    total_amount: 22000,
    payment_method: 'Espèces',
    customer_name: 'Client Comptoir',
    cashier_id: 'usr_demo_cashier_02',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    items: [
      { id: 'item_03', sale_id: 'sal_03', product_id: 'prod_03', quantity: 1, unit_price: 22000, subtotal: 22000 },
    ],
  },
  {
    id: 'sal_04',
    organization_id: 'org_pointe_noire_01',
    total_amount: 7200,
    payment_method: 'Mobile Money',
    customer_name: 'Clarisse Loubaki',
    cashier_id: 'usr_demo_cashier_02',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      { id: 'item_04', sale_id: 'sal_04', product_id: 'prod_05', quantity: 2, unit_price: 3600, subtotal: 7200 },
    ],
  },
  {
    id: 'sal_05',
    organization_id: 'org_pointe_noire_01',
    total_amount: 26000,
    payment_method: 'Carte',
    customer_name: 'Dr. Obambi',
    cashier_id: 'usr_demo_admin_01',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      { id: 'item_05', sale_id: 'sal_05', product_id: 'prod_02', quantity: 2, unit_price: 13000, subtotal: 26000 },
    ],
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_01',
    organization_id: 'org_pointe_noire_01',
    amount: 150000,
    category: 'Loyer',
    description: 'Loyer local commercial mois en cours',
    date: new Date().toISOString().split('T')[0],
    created_by: 'usr_demo_admin_01',
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp_02',
    organization_id: 'org_pointe_noire_01',
    amount: 35000,
    category: 'Électricité',
    description: 'Facture E²C électricité magasin',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    created_by: 'usr_demo_admin_01',
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp_03',
    organization_id: 'org_pointe_noire_01',
    amount: 25000,
    category: 'Internet',
    description: 'Abonnement fibre Canalbox Pro',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    created_by: 'usr_demo_admin_01',
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp_04',
    organization_id: 'org_pointe_noire_01',
    amount: 15000,
    category: 'Transport',
    description: 'Course livraison marchandise port de Pointe-Noire',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    created_by: 'usr_demo_admin_01',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov_01',
    organization_id: 'org_pointe_noire_01',
    product_id: 'prod_01',
    type: 'IN',
    quantity: 20,
    note: 'Réapprovisionnement fournisseur initial',
    created_by: 'usr_demo_admin_01',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'mov_02',
    organization_id: 'org_pointe_noire_01',
    product_id: 'prod_01',
    type: 'OUT',
    quantity: 2,
    note: 'Vente #sal_01',
    created_by: 'usr_demo_admin_01',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// Helper pour localStorage sécurisé côté client
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export const LocalStore = {
  getProfile: (): Profile => getStored<Profile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILE),
  setProfile: (profile: Profile) => setStored(STORAGE_KEYS.CURRENT_USER, profile),

  getOrganization: (): Organization => getStored<Organization>(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION),
  setOrganization: (org: Organization) => setStored(STORAGE_KEYS.ORGANIZATION, org),

  getMembers: (): OrganizationMember[] => getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS),
  setMembers: (members: OrganizationMember[]) => setStored(STORAGE_KEYS.MEMBERS, members),

  getCategories: (): Category[] => getStored<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  setCategories: (cats: Category[]) => setStored(STORAGE_KEYS.CATEGORIES, cats),

  getProducts: (): Product[] => {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const categories = LocalStore.getCategories();
    return products.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.category_id),
    }));
  },
  setProducts: (products: Product[]) => setStored(STORAGE_KEYS.PRODUCTS, products),

  getStockMovements: (): StockMovement[] => {
    const movements = getStored<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_MOVEMENTS);
    const products = LocalStore.getProducts();
    return movements.map((m) => ({
      ...m,
      product: products.find((p) => p.id === m.product_id),
    }));
  },
  setStockMovements: (movements: StockMovement[]) => setStored(STORAGE_KEYS.STOCK_MOVEMENTS, movements),

  getSales: (): Sale[] => {
    const sales = getStored<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
    const products = LocalStore.getProducts();
    return sales.map((s) => ({
      ...s,
      items: s.items?.map((it) => ({
        ...it,
        product: products.find((p) => p.id === it.product_id),
      })),
    }));
  },
  setSales: (sales: Sale[]) => setStored(STORAGE_KEYS.SALES, sales),

  getExpenses: (): Expense[] => getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  setExpenses: (expenses: Expense[]) => setStored(STORAGE_KEYS.EXPENSES, expenses),

  // Calcul dynamique des statistiques du Dashboard
  getDashboardStats: (): DashboardStats => {
    const sales = LocalStore.getSales();
    const expenses = LocalStore.getExpenses();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todaySales = sales.filter((s) => s.created_at.startsWith(todayStr));
    const revenueToday = todaySales.reduce((acc, s) => acc + s.total_amount, 0);
    const salesCountToday = todaySales.length;

    // Dépenses du mois courant
    const currentMonthPrefix = todayStr.substring(0, 7);
    const monthlyExpenses = expenses
      .filter((e) => e.date.startsWith(currentMonthPrefix))
      .reduce((acc, e) => acc + e.amount, 0);

    // Chiffre d'affaires du mois
    const monthlySales = sales.filter((s) => s.created_at.startsWith(currentMonthPrefix));
    const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.total_amount, 0);

    const estimatedProfit = monthlyRevenue - monthlyExpenses;

    return {
      revenueToday,
      salesCountToday,
      monthlyExpenses,
      estimatedProfit,
    };
  },
};
