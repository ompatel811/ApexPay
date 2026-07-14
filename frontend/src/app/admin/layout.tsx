'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ShieldCheck, User, BellRing } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, admin } = useAdminAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [mounted, isAuthenticated, pathname, router]);

  if (!mounted) {
    return null; // Prevents server-client mismatch
  }

  // Render Login page standalone without Shell layout
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  // If not authenticated (and redirect is in progress), render fallback loader
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <ShieldCheck className="h-12 w-12 text-indigo-500 animate-bounce mx-auto" />
          <p className="text-sm text-slate-400">Authenticating credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Panel Content Area */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Platform Management System</h1>
          </div>
          <div className="flex items-center gap-6">
            {/* Announcement Broadcast Status Indicator */}
            <div className="relative cursor-pointer hover:text-indigo-400 transition-colors">
              <BellRing className="h-5 w-5 text-slate-400" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-900"></span>
            </div>

            {/* Profile Icon Widget */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200">{admin?.username}</span>
                <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Admin Portal</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-8 bg-slate-950 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
