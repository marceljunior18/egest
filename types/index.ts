// ==============================================================================
// eGest MVP V1 - DOMAIN TYPES & INTERFACES
// ==============================================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'EMPLOYEE';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: 'Boutique' | 'Restaurant' | 'Pharmacie' | 'Autre' | string;
  phone?: string;
  address?: string;
  city: string;
  country: string;
  currency: string; // 'FCFA'
  owner_id: string;
  created_at?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at?: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  created_at?: string;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  category?: Category;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock: number;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  organization_id: string;
  product_id: string;
  product?: Product;
  type: StockMovementType;
  quantity: number;
  note?: string;
  created_by?: string;
  created_at: string;
}

export type PaymentMethod = 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';

export interface Sale {
  id: string;
  organization_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  customer_name?: string;
  cashier_id?: string;
  cashier?: Profile;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type ExpenseCategory =
  | 'Transport'
  | 'Salaire'
  | 'Loyer'
  | 'Internet'
  | 'Électricité'
  | 'Achat marchandises'
  | 'Marketing'
  | 'Autres';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Transport',
  'Salaire',
  'Loyer',
  'Internet',
  'Électricité',
  'Achat marchandises',
  'Marketing',
  'Autres',
];

export interface Expense {
  id: string;
  organization_id: string;
  amount: number;
  category: ExpenseCategory | string;
  description?: string;
  date: string;
  created_by?: string;
  created_at?: string;
}

export interface DashboardStats {
  revenueToday: number;
  salesCountToday: number;
  monthlyExpenses: number;
  estimatedProfit: number;
  revenueChange?: number;
}
