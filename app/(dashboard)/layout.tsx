'use client';

// ==============================================================================
// eGest MVP V1 - DASHBOARD MAIN LAYOUT (SIDEBAR + HEADER + MAIN CONTENT)
// ==============================================================================

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#090D16]">
      {/* Sidebar (Desktop fixée + Mobile Drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Wrapper (décalé à gauche sur desktop par w-64) */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
