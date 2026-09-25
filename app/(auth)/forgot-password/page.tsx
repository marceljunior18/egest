'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/components/ui/ToastProvider';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Veuillez renseigner votre email');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetErr) throw resetErr;
      }
      setIsSubmitted(true);
      toast.success('Lien de réinitialisation envoyé par email');
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Erreur lors de l’envoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-[#090D16] dark:via-[#0f172a] dark:to-[#090D16]">
      <div className="w-full max-w-md">
        {/* Brand */}
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
            Mot de passe oublié ?
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saisissez votre email pour recevoir les instructions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Vérifiez vos e-mails</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Un lien de réinitialisation sécurisé a été transmis à <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
              </p>
              <div className="mt-6">
                <Link href="/login">
                  <Button variant="outline" size="md" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse Email associée à votre compte"
                type="email"
                placeholder="directeur@entreprise.cg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                startIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
                Envoyer le lien
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
