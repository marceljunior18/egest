'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/ToastProvider';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Veuillez saisir votre email';
    if (!password) newErrors.password = 'Veuillez renseigner votre mot de passe';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      if (res?.error) {
        toast.error(res.error.message || 'Identifiants invalides');
      } else {
        toast.success('Connexion réussie ! Redirection...');
      }
    } catch {
      toast.error('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('admin@egest-congo.cg');
    setPassword('demo-congo-2026');
    setIsLoading(true);
    await signIn('admin@egest-congo.cg', 'demo-congo-2026');
    toast.success('Connecté en tant qu’Administrateur Démo !');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-[#090D16] dark:via-[#0f172a] dark:to-[#090D16]">
      <div className="w-full max-w-md">
        {/* Logo Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E40AF] text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              eGest
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Connexion à votre espace
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            La gestion simple et intelligente de votre entreprise
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adresse Email"
              type="email"
              placeholder="directeur@entreprise.cg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              startIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <div className="space-y-1">
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                startIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
              />
              <div className="flex justify-end pt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#1E40AF] hover:underline dark:text-blue-400"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Se connecter
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleQuickDemo}
              className="w-full text-xs font-semibold border-dashed"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
              Connexion Démo Rapide (1-clic)
            </Button>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Pas encore de compte entreprise ?{' '}
            <Link href="/register" className="font-bold text-[#1E40AF] hover:underline dark:text-blue-400">
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
