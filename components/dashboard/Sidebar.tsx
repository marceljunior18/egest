'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Receipt,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
  Building2,
  Users2,
  Truck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { formatRole } from '@/lib/formatters';
import { toast } from '@/components/ui/ToastProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { organization, currentRole } = useOrganization();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Ventes', href: '/dashboard/sales', icon: ShoppingCart },
    { label: 'Produits', href: '/dashboard/products', icon: Package },
    { label: 'Stock', href: '/dashboard/inventory', icon: Layers },
    { label: 'Dépenses', href: '/dashboard/expenses', icon: Receipt },
    { label: 'Employés', href: '/dashboard/employees', icon: Users },
    { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
  ];

  const v2Items = [
    { label: 'Clients', icon: Users2 },
    { label: 'Fournisseurs', icon: Truck },
    { label: 'Rapports IA', icon: BarChart3 },
  ];

  const handleV2Click = (name: string) => {
    toast.info(`${name} : Bientôt disponible en V2.`);
  };

  const NavContent = (
    <div className="flex h-full flex-col justify-between p-4">
      {/* Brand & Organization */}
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1E40AF] to-blue-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                eGest
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#1E40AF] dark:bg-blue-900 dark:text-blue-300">
                  MVP V1
                </span>
              </span>
              <span className="text-[11px] block text-slate-400 font-medium">Business OS PME</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entreprise courante badge */}
        <div className="my-4 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#1E40AF] dark:text-blue-300 flex items-center justify-center font-bold text-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {organization?.name || 'Mon Entreprise'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {organization?.city || 'Pointe-Noire'} • {organization?.currency || 'FCFA'}
            </p>
          </div>
        </div>

        {/* Navigation principale */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Gestion Quotidienne
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[#1E40AF] text-white shadow-sm font-semibold dark:bg-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Modules V2 - Teaser */}
        <div className="mt-6 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Extensions V2
          </p>
          {v2Items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleV2Click(item.label)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-normal text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  V2
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profil & Footer */}
      <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-2">
        <Link
          href="/dashboard/settings"
          onClick={() => onClose()}
          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-white font-bold text-xs uppercase shadow-sm">
            {profile?.first_name ? profile.first_name[0] : 'U'}
            {profile?.last_name ? profile.last_name[0] : ''}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Utilisateur'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {formatRole(currentRole)}
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between px-2 pt-1 text-xs">
          <button
            onClick={() =>
              toast.info(
                'Support eGest Pointe-Noire : Contactez support@egest.cg ou WhatsApp +242 06 000 00 00'
              )
            }
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Aide</span>
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quitter</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-white border-r border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
        {NavContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-10 transition-transform">
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
};
