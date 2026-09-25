import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, BarChart2, Layers, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-slate-50 to-blue-50/30 dark:from-[#090D16] dark:via-[#0c1222] dark:to-[#0f172a]">
      {/* Navigation */}
      <header className="border-b border-slate-200/80 bg-white/70 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-md shadow-blue-500/20 font-black text-xl">
              e
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                eGest
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-300">
                Pointe-Noire
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="shadow-sm">
                Commencer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-[#1E40AF] dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300 mb-8 shadow-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>Business OS conçu pour les PME en Afrique • Devise FCFA</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white leading-[1.15]">
          La gestion <span className="text-[#1E40AF] dark:text-blue-500">simple & intelligente</span> de votre entreprise
        </h1>

        <p className="mt-6 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
          Pilotez vos ventes au comptoir, surveillez vos niveaux de stock en temps réel, enregistrez vos dépenses quotidiennes et calculez vos bénéfices nets sans tableur complexe.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="shadow-lg shadow-blue-600/20 text-base font-semibold px-8 py-3">
              Ouvrir le Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-base font-semibold px-6 py-3">
              Connexion / Démo
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-400 mb-4">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Point de Vente Rapide</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Saisie intuitive des ventes en Espèces, Mobile Money (Airtel/MTN) ou Carte avec déduction instantanée du stock.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Gestion du Stock</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Alertes de rupture automatique, gestion des réapprovisionnements, retours et inventaires physiques.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
              <BarChart2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Contrôle des Dépenses</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ventilation par poste (loyer, transport, salaires, électricité) pour connaître votre marge réelle.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Rôles & Sécurité</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ségrégation stricte des rôles : Administrateur, Gérant, Caissier et Employé avec Row-Level Security Supabase.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white px-6 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p>© 2026 eGest • Développé pour les entrepreneurs et PME de Pointe-Noire & Afrique Centrale.</p>
      </footer>
    </div>
  );
}
