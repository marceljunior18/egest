-- ==============================================================================
-- eGest MVP V1 - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Multi-tenant Business OS pour PME africaines (Devise : FCFA)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- PROFILES (lié à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ORGANIZATIONS (Entreprises)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Pointe-Noire',
  country TEXT NOT NULL DEFAULT 'Congo',
  currency TEXT NOT NULL DEFAULT 'FCFA',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ORGANIZATION_MEMBERS (Membres & Rôles)
-- Roles: ADMIN | MANAGER | CASHIER | EMPLOYEE
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- STOCK_MOVEMENTS
-- Types: IN | OUT | ADJUSTMENT
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Espèces', 'Mobile Money', 'Carte', 'Autre')),
  customer_name TEXT,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SALE_ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL,
  subtotal NUMERIC(15, 2) NOT NULL
);

-- EXPENSES
-- Catégories : Transport, Salaire, Loyer, Internet, Électricité, Achat marchandises, Marketing, Autres
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. HELPER FUNCTIONS FOR SECURITY & RLS

-- Obtenir la liste des IDs d'organisation auxquelles l'utilisateur appartient
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

-- Obtenir le rôle de l'utilisateur dans une organisation donnée
CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.organization_members WHERE organization_id = org_id AND user_id = auth.uid() LIMIT 1;
$$;

-- 4. ROW LEVEL SECURITY (RLS) ACTIVATION

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- PROFILES
CREATE POLICY "Users can view their own profile and members of their orgs"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() 
  OR id IN (
    SELECT user_id FROM public.organization_members 
    WHERE organization_id IN (SELECT public.get_user_organization_ids())
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- ORGANIZATIONS
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can create an organization"
ON public.organizations FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (id IN (
  SELECT organization_id FROM public.organization_members 
  WHERE user_id = auth.uid() AND role IN ('ADMIN')
));

-- ORGANIZATION_MEMBERS
CREATE POLICY "Members can view members of their organization"
ON public.organization_members FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Admins can insert members"
ON public.organization_members FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
  OR
  -- Allow owner during onboarding
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can update members"
ON public.organization_members FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete members"
ON public.organization_members FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- CATEGORIES
CREATE POLICY "Members can view categories of their org"
ON public.categories FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Admin and managers can manage categories"
ON public.categories FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members 
  WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
));

-- PRODUCTS
CREATE POLICY "Members can view products of their org"
ON public.products FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Admin and managers can manage products"
ON public.products FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members 
  WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
));

-- STOCK_MOVEMENTS
CREATE POLICY "Members can view stock movements of their org"
ON public.stock_movements FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Authorized roles can create stock movements"
ON public.stock_movements FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'CASHIER')
  )
);

-- SALES
CREATE POLICY "Members can view sales of their org"
ON public.sales FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Cashiers, managers and admins can create sales"
ON public.sales FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'CASHIER')
  )
);

-- SALE_ITEMS
CREATE POLICY "Members can view sale items of their org"
ON public.sale_items FOR SELECT
USING (sale_id IN (
  SELECT id FROM public.sales WHERE organization_id IN (SELECT public.get_user_organization_ids())
));

CREATE POLICY "Authorized roles can insert sale items"
ON public.sale_items FOR INSERT
WITH CHECK (sale_id IN (
  SELECT id FROM public.sales WHERE organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'CASHIER')
  )
));

-- EXPENSES
CREATE POLICY "Members can view expenses of their org"
ON public.expenses FOR SELECT
USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Admin and managers can insert/update expenses"
ON public.expenses FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members 
  WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
));

-- 6. AUTOMATIC PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. AUTOMATIC STOCK UPDATE ON SALE
CREATE OR REPLACE FUNCTION public.handle_sale_stock_deduction()
RETURNS TRIGGER AS $$
BEGIN
  -- Déduire le stock
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;

  -- Insérer un mouvement de stock
  INSERT INTO public.stock_movements (
    organization_id,
    product_id,
    type,
    quantity,
    note
  )
  SELECT 
    p.organization_id,
    NEW.product_id,
    'OUT',
    NEW.quantity,
    'Vente #' || SUBSTRING(NEW.sale_id::TEXT, 1, 8)
  FROM public.products p
  WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_sale_item_created ON public.sale_items;
CREATE TRIGGER on_sale_item_created
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_deduction();
