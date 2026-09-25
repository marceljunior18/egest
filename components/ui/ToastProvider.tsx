'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans text-sm',
          description: 'text-xs text-slate-500 dark:text-slate-400',
          actionButton: 'bg-[#1E40AF] text-white',
          cancelButton: 'bg-slate-100 text-slate-700',
          error: 'text-rose-600',
          success: 'text-emerald-600',
          warning: 'text-amber-600',
          info: 'text-blue-600',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
