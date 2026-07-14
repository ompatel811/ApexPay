'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Wallet, 
  Send, 
  QrCode, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell, 
  CreditCard,
  ChevronDown,
  Loader2,
  Activity,
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/NotificationBell';
import ToastNotification from '@/components/ToastNotification';
import { useNotificationStore } from '@/store/notificationStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const connectWebSocket = useNotificationStore((state) => state.connectWebSocket);
  const disconnectWebSocket = useNotificationStore((state) => state.disconnectWebSocket);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      connectWebSocket(user.username);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, user?.username, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <span className="text-slate-400 text-sm font-semibold tracking-wider">Securing your session...</span>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', active: pathname === '/dashboard' },
    { name: 'Profile', icon: User, path: '/dashboard/profile', active: pathname === '/dashboard/profile' },
    { name: 'Wallet', icon: Wallet, path: '/dashboard/wallet', active: pathname === '/dashboard/wallet' },
    { name: 'Bank Accounts', icon: CreditCard, path: '/dashboard/banks', active: pathname === '/dashboard/banks' },
    { name: 'UPI IDs', icon: Send, path: '/dashboard/upi', active: pathname === '/dashboard/upi' },
    { name: 'Payments', icon: Send, path: '/dashboard/payments/send', active: pathname === '/dashboard/payments/send' },
    { name: 'QR Payments', icon: QrCode, path: '/dashboard/qr', active: pathname === '/dashboard/qr' || pathname.startsWith('/dashboard/qr') },
    { name: 'Transactions', icon: History, path: '/dashboard/payments/history', active: pathname === '/dashboard/payments/history' },
    { name: 'Analytics', icon: Activity, path: '/dashboard/analytics', active: pathname === '/dashboard/analytics' },
    { name: 'Reports', icon: FileText, path: '/dashboard/reports', active: pathname === '/dashboard/reports' },
    { name: 'Budgets & Goals', icon: Sliders, path: '/dashboard/budgets', active: pathname === '/dashboard/budgets' },
    { name: 'AI Assistant', icon: Sparkles, path: '/dashboard/ai', active: pathname === '/dashboard/ai' || pathname.startsWith('/dashboard/ai') },
    { name: 'Notifications', icon: Bell, path: '/dashboard/notifications', active: pathname === '/dashboard/notifications' },
    { name: 'Merchant Portal', icon: Sliders, path: '/merchant/dashboard', active: false },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings', active: pathname === '/dashboard/settings' },
    { name: 'Help', icon: HelpCircle, path: '#', disabled: true },
  ];

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <ToastNotification />
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Sidebar Toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              Apex<span className="text-indigo-400">Pay</span>
            </span>
          </div>
        </div>

        {/* Center Search (UI Only) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search payments, transactions, settings..." 
            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            readOnly
          />
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-4 relative">
          {/* Notifications Bell */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 px-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left"
            >
              {user?.profilePhoto ? (
                <img 
                  src={`http://localhost:8080${user.profilePhoto}`} 
                  alt="avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold flex items-center justify-center text-xs border border-indigo-500/20">
                  {user ? getInitials(user.fullName) : 'U'}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-200 leading-none">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-none">@{user?.username}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-xl p-2 z-20 flex flex-col gap-0.5">
                  <Link 
                    href="/dashboard/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-sm"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Profile Settings
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 p-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all text-sm w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Core Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/5 p-4 shrink-0 justify-between">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 px-4 text-slate-600 rounded-2xl cursor-not-allowed select-none text-sm font-medium"
                    title="Available in future modules"
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[9px] bg-slate-900 border border-white/5 text-slate-500 px-1.5 py-0.5 rounded-md uppercase font-semibold">Soon</span>
                  </div>
                );
              }
              return (
                <Link 
                  key={index}
                  href={item.path}
                  className={`flex items-center gap-3 p-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                    item.active 
                      ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/15' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 px-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl text-sm font-medium transition-all text-left"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Left Sidebar (Mobile overlay) */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/10 p-4 z-45 md:hidden flex flex-col justify-between">
              <nav className="flex flex-col gap-1.5 mt-16">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  if (item.disabled) {
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 px-4 text-slate-600 rounded-2xl cursor-not-allowed select-none text-sm font-medium"
                      >
                        <Icon className="w-4.5 h-4.5" />
                        <span>{item.name}</span>
                        <span className="ml-auto text-[9px] bg-slate-950 border border-white/5 text-slate-500 px-1.5 py-0.5 rounded-md">Soon</span>
                      </div>
                    );
                  }
                  return (
                    <Link 
                      key={index}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                        item.active 
                          ? 'bg-indigo-600 text-white font-semibold' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 px-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl text-sm font-medium transition-all text-left"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Logout</span>
              </button>
            </aside>
          </>
        )}

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
