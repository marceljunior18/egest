'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/components/ui/ToastProvider';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password,
        });
        if (updateErr) throw updateErr;
      }
      toast.success('Votre mot de passe a été mis à jour avec succès');
      router.push('/login');
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Impossible de mettre à jour le mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-[#090D16] dark:via-[#0f172a] dark:to-[#090D16]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E40AF] text-white shadow-lg shadow-blue-600/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              eGest
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Nouveau mot de passe
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Définissez un nouveau mot de passe pour sécuriser votre accès
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              startIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={isLoading}>
              Mettre à jour et se connecter
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
