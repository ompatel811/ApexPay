'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import {
  LayoutDashboard,
  Users,
  Store,
  ArrowLeftRight,
  Wallet,
  Landmark,
  Fingerprint,
  QrCode,
  Bell,
  FileBarChart2,
  History,
  Settings,
  Activity,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/merchants', label: 'Merchants', icon: Store },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/banks', label: 'Linked Banks', icon: Landmark },
  { href: '/admin/upi', label: 'UPI IDs', icon: Fingerprint },
  { href: '/admin/qr', label: 'QR Management', icon: QrCode },
  { href: '/admin/notifications', label: 'Announcements', icon: Bell },
  { href: '/admin/fraud', label: 'Fraud Dashboard', icon: ShieldAlert },
  { href: '/admin/fraud/alerts', label: 'Fraud Alerts', icon: AlertTriangle },
  { href: '/admin/fraud/investigations', label: 'Investigations', icon: Search },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/admin/logs', label: 'Audit Logs', icon: History },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
  { href: '/admin/health', label: 'System Health', icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, clearAdminAuth } = useAdminAuthStore();

  const handleLogout = () => {
    clearAdminAuth();
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-2 border-b border-slate-800 bg-slate-950">
        <ShieldCheck className="h-6 w-6 text-indigo-400 animate-pulse" />
        <span className="font-bold text-lg tracking-wider text-slate-50 uppercase">ApexPay Admin</span>
      </div>

      {/* Admin User Info Banner */}
      {admin && (
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col">
          <span className="text-sm font-semibold text-slate-200">{admin.fullName}</span>
          <span className="text-xs text-indigo-400 capitalize">{admin.roles?.[0]?.toLowerCase().replace('_', ' ')}</span>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 border border-red-600/20 hover:border-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
