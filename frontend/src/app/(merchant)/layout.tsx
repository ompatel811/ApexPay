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
  Users,
  ShieldAlert,
  ArrowLeftRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/NotificationBell';
import ToastNotification from '@/components/ToastNotification';
import { useNotificationStore } from '@/store/notificationStore';
import { merchantService, MerchantProfileResponseData } from '@/services/merchantService';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [merchant, setMerchant] = useState<MerchantProfileResponseData | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(true);

  const connectWebSocket = useNotificationStore((state) => state.connectWebSocket);
  const disconnectWebSocket = useNotificationStore((state) => state.disconnectWebSocket);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      connectWebSocket(user.username);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, user?.username, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchMerchant = async () => {
      try {
        setLoadingMerchant(true);
        const data = await merchantService.getProfile();
        setMerchant(data);
        
        // If profile loaded, redirect from register/page if they are already registered
        if (pathname === '/merchant/register') {
          router.push('/merchant/dashboard');
        } else if (data.verificationStatus !== 'APPROVED' && pathname !== '/merchant/kyc' && pathname !== '/merchant/settings') {
          router.push('/merchant/kyc');
        }
      } catch (err: any) {
        // If 404 (no business profile), redirect to registration without logging noise
        if (pathname !== '/merchant/register') {
          router.push('/merchant/register');
        }
      } finally {
        setLoadingMerchant(false);
      }
    };

    fetchMerchant();
  }, [isAuthenticated, pathname, router]);

  if (!mounted || !isAuthenticated || (loadingMerchant && pathname !== '/merchant/register')) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <span className="text-slate-400 text-sm font-semibold tracking-wider">Loading Merchant Workspace...</span>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/merchant/dashboard', active: pathname === '/merchant/dashboard', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'KYC Compliance', icon: ShieldAlert, path: '/merchant/kyc', active: pathname === '/merchant/kyc' },
    { name: 'Payment Links', icon: FileText, path: '/merchant/payment-links', active: pathname === '/merchant/payment-links', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Merchant QR', icon: QrCode, path: '/merchant/qr', active: pathname === '/merchant/qr', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Refunds Manager', icon: ArrowLeftRight, path: '/merchant/refunds', active: pathname === '/merchant/refunds', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Settlements', icon: CreditCard, path: '/merchant/settlements', active: pathname === '/merchant/settlements', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Business Analytics', icon: Activity, path: '/merchant/analytics', active: pathname === '/merchant/analytics', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Team Roster', icon: Users, path: '/merchant/team', active: pathname === '/merchant/team', disabled: merchant?.verificationStatus !== 'APPROVED' },
    { name: 'Business Settings', icon: Settings, path: '/merchant/settings', active: pathname === '/merchant/settings' },
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight tracking-tight text-white">
                {merchant?.businessName || 'Merchant Portal'}
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase leading-none">
                Business Console
              </span>
            </div>
          </div>
        </div>

        {/* Center Info Banner */}
        {merchant && merchant.verificationStatus !== 'APPROVED' && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-medium">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            KYC Status: {merchant.verificationStatus}. Some console features remain locked.
          </div>
        )}

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-4 relative">
          {/* Switch to Personal Wallet button */}
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md"
          >
            <User className="w-3.5 h-3.5" /> Personal Account
          </Link>

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
                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-xs border border-purple-500/20">
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
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-sm sm:hidden"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Personal Account
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
                    className="flex items-center gap-3 p-3 px-4 text-slate-700 rounded-2xl cursor-not-allowed select-none text-sm font-medium"
                    title="Please complete approved KYC to unlock this section."
                  >
                    <Icon className="w-4.5 h-4.5 text-slate-800" />
                    <span>{item.name}</span>
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

          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3 px-4 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-2xl text-sm font-medium transition-all text-left"
          >
            <ArrowLeftRight className="w-4.5 h-4.5" />
            <span>Switch to Personal</span>
          </Link>
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
                        className="flex items-center gap-3 p-3 px-4 text-slate-700 rounded-2xl cursor-not-allowed select-none text-sm font-medium"
                      >
                        <Icon className="w-4.5 h-4.5" />
                        <span>{item.name}</span>
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

              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 px-4 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-2xl text-sm font-medium transition-all text-left"
              >
                <ArrowLeftRight className="w-4.5 h-4.5" />
                <span>Switch to Personal</span>
              </Link>
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
