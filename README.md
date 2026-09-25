# eGest — MVP V1

> **"La gestion simple et intelligente de votre entreprise"**  
> Business OS et SaaS de gestion commerciale pour les PME en Afrique.  
> **Ville pilote :** Pointe-Noire (République du Congo) • **Devise :** FCFA

---

## 🚀 Présentation du Produit

**eGest** est une solution SaaS complète et multi-tenant conçue pour répondre aux défis concrets des commerçants et entrepreneurs africains :
* **Caisse & Ventes (POS)** : Saisie rapide des encaissements au comptoir (Espèces, Mobile Money Airtel/MTN, Carte bancaire).
* **Déduction automatique du Stock** : Mise à jour en temps réel des stocks et traçabilité des mouvements d'entrée/sortie.
* **Alertes de Stock Faible** : Notification visuelle immédiate dès qu'un produit passe sous son seuil d'alerte ou tombe en rupture.
* **Maîtrise des Dépenses & Rentabilité** : Suivi des charges fixes et variables (loyer, transport, salaires, électricité E²C, Internet) et calcul du bénéfice net réel.
* **Gestion d'Équipe & Rôles stricts** : Ségrégation des tâches entre **ADMIN**, **MANAGER**, **CASHIER** et **EMPLOYEE**.
* **Design Moderne & Responsive** : Conçu avec une palette sobre et haut de gamme, mode sombre natif, optimisé pour smartphone, tablette et écran caisse.

---

## 🛠️ Stack Technique

* **Framework Frontend** : [Next.js 14 (App Router)](https://nextjs.org/) + TypeScript strict
* **Styling & Design System** : [Tailwind CSS](https://tailwindcss.com/) + Icônes [Lucide React](https://lucide.dev/)
* **Backend & Base de Données** : [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security + Triggers)
* **Composants UI** : Système modulaire sur-mesure (Boutons, Modales, Tables responsives, Skeletons, Toasts)
* **Déploiement** : Vercel
* **Gestion de Version** : Git & GitHub

---

## 📁 Architecture du Projet

```text
e-gest/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Connexion avec option Démo rapide
│   │   ├── register/           # Inscription responsable d'entreprise
│   │   ├── forgot-password/    # Demande de réinitialisation
│   │   └── reset-password/     # Nouveau mot de passe
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Layout avec Sidebar tiroir mobile + Header
│   │   ├── dashboard/          # Vue d'ensemble, graphiques 7j, alertes stock
│   │   ├── products/           # Catalogue produits, catégories, SKU, prix
│   │   ├── inventory/          # Gestion des stocks, flux IN/OUT et ajustements
│   │   ├── sales/              # Caisse enregistreuse POS, panier, reçus de vente
│   │   ├── expenses/           # Suivi des dépenses par poste et marge
│   │   ├── employees/          # Membres de l'équipe et rôles (RBAC)
│   │   └── settings/           # Profil utilisateur et fiche entreprise
│   ├── onboarding/             # Workflow 3 étapes de création d'entreprise
│   ├── globals.css             # Tokens CSS, thèmes Clair / Sombre
│   ├── layout.tsx              # Root Layout avec Inter font & ToastProvider
│   └── page.tsx                # Page d'accueil commerciale
├── components/
│   ├── ui/                     # Button, Input, Modal, Table, Badge, Card, Toast...
│   └── dashboard/              # Sidebar, Header, StatsCard...
├── hooks/                      # useAuth, useOrganization, usePermissions
├── lib/
│   ├── supabase.ts             # Client Supabase
│   ├── store.ts                # Store local haute fidélité (développement offline / démo)
│   ├── formatters.ts           # Formatage FCFA ("1 250 000 FCFA") et dates FR
│   └── utils.ts                # Fusion conditionnelle Tailwind (cn)
├── services/                   # products.ts, stock.ts, sales.ts, expenses.ts
├── supabase/
│   └── schema.sql              # Schéma SQL complet, triggers et politiques RLS
├── types/                      # Interfaces TypeScript complètes
└── middleware.ts               # Protection des routes /dashboard/*
```

---

## ⚙️ Installation & Démarrage Local

### 1. Prérequis
* Node.js v20+ LTS
* Gestionnaire de paquets `npm`

### 2. Cloner et installer les dépendances
```bash
git clone https://github.com/votre-compte/e-gest.git
cd e-gest
npm install
```

### 3. Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```

Renseignez vos clés de projet Supabase :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
```

> **Mode Démo Immédiat :** Même sans identifiants Supabase renseignés, eGest fonctionne immédiatement grâce à son store de persistance locale intégré pré-configuré avec des données réalistes de Pointe-Noire.

### 4. Initialisation de la Base de Données Supabase
1. Rendez-vous sur votre dashboard [Supabase](https://supabase.com).
2. Ouvrez l'éditeur SQL (**SQL Editor**).
3. Copiez et exécutez l'intégralité du script contenu dans [`supabase/schema.sql`](supabase/schema.sql).
4. Ce script met en place :
   * Les 9 tables métier multi-tenant.
   * L'activation obligatoire de **Row Level Security (RLS)** sur chaque table.
   * Les déclencheurs automatiques de profil lors de l'inscription (`handle_new_user`).
   * Les déclencheurs de déduction de stock lors de chaque vente (`handle_sale_stock_deduction`).

### 5. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🔒 Sécurité & Multi-Tenant

* **Isolation des données** : Toutes les requêtes filtrent obligatoirement par `organization_id`.
* **Row-Level Security (RLS)** : Même en cas de requête directe côté client, PostgreSQL bloque tout accès aux données extérieures à l'organisation de l'utilisateur connecté.
* **Rôles applicatifs** :
  * **ADMIN** : Propriétaire / Direction — Gestion complète et administration.
  * **MANAGER** : Gérant — Catalogue, réapprovisionnement, caisse et dépenses.
  * **CASHIER** : Caissier — Ventes comptoir uniquement.
  * **EMPLOYEE** : Salarié — Consultation du stock et du catalogue en lecture seule.

---

## 🚢 Déploiement en Production (Vercel)

1. Connectez votre dépôt GitHub à **Vercel**.
2. Dans les paramètres de votre projet Vercel (**Environment Variables**), ajoutez :
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Lancez le déploiement. Vercel compile automatiquement le bundle Next.js 14 optimisé.

---

## 📄 Licence
Propriété exclusive de eGest. Tous droits réservés.
