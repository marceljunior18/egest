'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Plus, Moon, Sun, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/ToastProvider';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { organization } = useOrganization();
  const { profile } = useAuth();
  const { canCreateSale } = usePermissions();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      {/* Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white md:text-base">
            {organization?.name || 'eGest'}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {organization?.city || 'Pointe-Noire'} • En ligne
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Action Vente Rapide */}
        {canCreateSale && (
          <Link href="/dashboard/sales?new=true">
            <Button size="sm" variant="primary" className="hidden sm:inline-flex shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle Vente
            </Button>
          </Link>
        )}

        {/* Notifications */}
        <button
          onClick={() => toast.info('Aucune notification non lue')}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Mini Avatar */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1E40AF] font-bold text-xs uppercase dark:bg-blue-900/60 dark:text-blue-300">
            {profile?.first_name ? profile.first_name[0] : 'U'}
          </div>
          <span className="hidden lg:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {profile?.first_name || 'Profil'}
          </span>
        </Link>
      </div>
    </header>
  );
};
