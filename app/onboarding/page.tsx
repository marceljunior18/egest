'use client';

// ==============================================================================
// eGest MVP V1 - ONBOARDING WORKFLOW (3 ÉTAPES AVEC BARRE DE PROGRESSION)
// ==============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/components/ui/ToastProvider';
import {
  Sparkles,
  Building,
  Store,
  UtensilsCrossed,
  Pill,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Coins,
  MapPin,
  Phone,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: '',
    sector: 'Boutique',
    phone: '',
    address: '',
    city: 'Pointe-Noire',
    country: 'République du Congo',
    currency: 'FCFA',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectors = [
    { id: 'Boutique', label: 'Boutique / Commerce', icon: Store, desc: 'Prêt-à-porter, quincaillerie, cosmétiques' },
    { id: 'Restaurant', label: 'Restaurant / Bar', icon: UtensilsCrossed, desc: 'Restauration rapide, maquis, salon de thé' },
    { id: 'Pharmacie', label: 'Pharmacie / Dépôt', icon: Pill, desc: 'Produits de santé, officines, parapharmacie' },
    { id: 'Autre', label: 'Autre Entreprise', icon: Briefcase, desc: 'Services, agence, atelier, négoce général' },
  ];

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!companyData.name.trim()) newErrors.name = 'Le nom de votre entreprise est obligatoire';
    if (!companyData.city.trim()) newErrors.city = 'Veuillez préciser la ville (ex: Pointe-Noire)';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setStep(3); // Passage à l'écran de création

    try {
      await createOrganization(companyData);
      toast.success('Votre espace entreprise a été configuré avec succès !');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Erreur lors de la création');
      setStep(2);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-[#090D16] dark:via-[#0c1322] dark:to-[#090D16] p-4 md:p-8">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-2xl flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-md shadow-blue-600/20 font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white">eGest</span>
            <span className="text-xs text-slate-400 block">Configuration initiale</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500">Étape {step} sur 3</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-2xl mb-8">
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#1E40AF] transition-all duration-500 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 flex flex-col justify-center">
        {/* Étape 1 : Bienvenue */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 md:p-12 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center animate-fadeIn">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400 mb-6 shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              Bienvenue sur eGest !
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Le premier Business OS conçu sur mesure pour booster la rentabilité des PME en République du Congo et en Afrique Centrale.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs text-[#1E40AF] dark:text-blue-400">1. Ventes au comptoir</span>
                <p className="text-[11px] text-slate-500 mt-1">Enregistrement fluide des règlements en FCFA (Espèces / Mobile Money).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">2. Suivi de stock</span>
                <p className="text-[11px] text-slate-500 mt-1">Alertes automatiques dès qu’un article passe sous le seuil d’alerte.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs text-amber-600 dark:text-amber-400">3. Marge et dépenses</span>
                <p className="text-[11px] text-slate-500 mt-1">Calcul du bénéfice réel en déduisant toutes vos charges d’exploitation.</p>
              </div>
            </div>

            <div className="mt-10">
              <Button size="lg" onClick={handleNextStep1} className="w-full md:w-auto px-8 shadow-lg shadow-blue-600/20">
                Configurer mon entreprise
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2 : Informations de l'entreprise */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 md:p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Informations de votre entreprise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ces paramètres permettront d’adapter vos reçus et votre catalogue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-5">
              <Input
                label="Nom commercial de l'entreprise"
                placeholder="Ex: Boutique Élite Pointe-Noire, Pharmacie du Mayombe..."
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                error={errors.name}
                startIcon={<Building className="w-4 h-4" />}
                required
              />

              {/* Choix du secteur */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Secteur d’activité principal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sectors.map((sec) => {
                    const SecIcon = sec.icon;
                    const isSelected = companyData.sector === sec.id;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setCompanyData({ ...companyData, sector: sec.id })}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#1E40AF] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40 ring-1 ring-[#1E40AF]'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-[#1E40AF] text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <SecIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {sec.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {sec.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Téléphone professionnel"
                  placeholder="+242 06 000 00 00"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  startIcon={<Phone className="w-4 h-4" />}
                />
                <Input
                  label="Adresse / Quartier"
                  placeholder="Ex: Moe Pratt, Grand Marché..."
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Ville"
                  placeholder="Pointe-Noire"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  error={errors.city}
                  required
                />
                <Input
                  label="Pays"
                  value={companyData.country}
                  disabled
                  helperText="Zone CEMAC"
                />
                <Input
                  label="Devise"
                  value={companyData.currency}
                  disabled
                  startIcon={<Coins className="w-4 h-4" />}
                  helperText="Fixé à FCFA"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-6" isLoading={isSubmitting}>
                Valider et créer mon espace de travail
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>
        )}

        {/* Étape 3 : Création de l'espace */}
        {step === 3 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center animate-fadeIn">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-6 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Création de votre espace en cours...
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Isolation des données multi-tenant, configuration des catégories et préparation du tableau de bord.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-2 w-48 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[pulse_1s_infinite] w-full" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-6">
        eGest Multi-Tenant Architecture • République du Congo
      </footer>
    </div>
  );
}
