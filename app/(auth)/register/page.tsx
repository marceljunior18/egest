'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/ToastProvider';
import { Sparkles, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d’email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Numéro de téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis (min. 6 caractères)';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (res?.error) {
        toast.error(res.error.message || 'Erreur lors de l’inscription');
      } else {
        toast.success('Compte créé avec succès ! Bienvenue.');
      }
    } catch {
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-[#090D16] dark:via-[#0f172a] dark:to-[#090D16]">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E40AF] text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              eGest
            </span>
          </Link>
          <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            Créer votre compte responsable
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Rejoignez les entrepreneurs modernes de Pointe-Noire et du Congo
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Christian"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                startIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Nom"
                placeholder="Mavoungou"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                startIcon={<User className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Adresse Email"
              type="email"
              placeholder="contact@boutique-elite.cg"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              startIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Numéro de téléphone (WhatsApp / Airtel / MTN)"
              type="tel"
              placeholder="+242 06 600 00 00"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              startIcon={<Phone className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                startIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="Confirmation"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                startIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={isLoading}>
              Continuer vers la création d’entreprise
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Déjà inscrit sur eGest ?{' '}
            <Link href="/login" className="font-bold text-[#1E40AF] hover:underline dark:text-blue-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
