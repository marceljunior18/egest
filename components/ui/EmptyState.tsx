import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/50 dark:text-blue-400 mb-4 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} variant="primary" size="md">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
