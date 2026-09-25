import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-[#1E40AF] dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/50',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/50',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/50',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
          <h4 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {value}
          </h4>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110', style.bg, style.text)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
