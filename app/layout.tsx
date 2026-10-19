import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eGest — La gestion simple et intelligente de votre entreprise',
  description:
    'SaaS de gestion commerciale et Business OS pour les PME africaines. Suivi des ventes, gestion des stocks, dépenses et rentabilité en FCFA. Ville pilote : Pointe-Noire, Congo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'eGest',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E40AF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-[#F9FAFB] text-[#111827] dark:bg-[#090D16] dark:text-[#F3F4F6] transition-colors">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
