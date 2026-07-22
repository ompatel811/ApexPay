'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWalletQuery } from '@/hooks/useWallet';
import { 
  useSessionsQuery, 
  useActivityQuery, 
  useAuth 
} from '@/hooks/useAuth';
import { 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Activity, 
  Clock, 
  Send, 
  PlusCircle, 
  QrCode, 
  History,
  Trash2,
  Lock,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: sessions, isLoading: sessionsLoading } = useSessionsQuery();
  const { data: activities, isLoading: activitiesLoading } = useActivityQuery();
  const { data: wallet } = useWalletQuery();
  const { revokeSession, isRevokingSession } = useAuth();

  // Calculate profile completeness
  const getProfileCompleteness = () => {
    if (!user) return 0;
    let score = 4; // fullName, username, email, mobileNumber are required
    const max = 6;
    if (user.profilePhoto) score++;
    if (user.dateOfBirth) score++;
    return Math.round((score / max) * 100);
  };

  const getFriendlyActivityMessage = (action: string) => {
    switch (action) {
      case 'USER_REGISTER': return 'Your account was registered successfully';
      case 'USER_LOGIN': return 'Successfully authenticated session';
      case 'LOGIN_FAILURE': return 'Failed login attempt detected';
      case 'USER_LOGOUT': return 'Successfully signed out';
      case 'USER_UPDATE_PROFILE': return 'Personal profile details modified';
      case 'USER_UPDATE_PROFILE_PHOTO': return 'Uploaded new profile photo';
      case 'USER_DELETE_PROFILE_PHOTO': return 'Removed profile photo';
      case 'REVOKE_SESSION': return 'Revoked active device session';
      default: return action.replace(/_/g, ' ');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const completeness = getProfileCompleteness();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Banner Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-white/5 rounded-3xl p-6.5 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Customer Console
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Welcome back, {user?.fullName}!</h2>
              <p className="text-xs text-slate-400 mt-1">Status: <span className="text-emerald-400 font-bold uppercase">{user?.accountStatus}</span> | Role: <span className="text-slate-200">{user?.roles.join(', ')}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Email Address</span>
              <span className="text-slate-200 font-medium block mt-0.5">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Mobile Number</span>
              <span className="text-slate-200 font-medium block mt-0.5">{user?.mobileNumber}</span>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6.5 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-2">Profile Integrity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Fill in missing profile photos or date of birth details under settings to complete verification.</p>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-white">{completeness}%</span>
              <span className="text-xs text-indigo-400 font-bold">Completeness</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Account summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Wallet Balance widget */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden md:col-span-2 flex flex-col justify-between">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Available Wallet Settlement</span>
            <h2 className="text-3xl font-black text-white mt-1.5">
              {wallet ? new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet.currency || 'USD' }).format(wallet.availableBalance) : '$0.00'}
            </h2>
          </div>
          <div className="flex gap-2.5 mt-6">
            <Link 
              href="/dashboard/payments/send"
              className="flex-1 bg-indigo-650 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" /> Pay
            </Link>
            <Link 
              href="/dashboard/wallet"
              className="flex-1 bg-slate-950 border border-white/5 hover:border-white/10 text-slate-200 text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              + Load Money
            </Link>
          </div>
        </div>

        {/* Quick actions placeholders */}
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 mb-4">
              <PlusCircle className="w-5 h-5 text-slate-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Link Bank Account</h4>
            <p className="text-xs text-slate-500 leading-normal">Securely link external savings accounts</p>
          </div>
          <button className="mt-4 text-xs font-bold text-slate-500 cursor-not-allowed flex items-center gap-1">
            Link &rarr;
          </button>
        </div>

        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 mb-4">
              <QrCode className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">QR Payments</h4>
            <p className="text-xs text-slate-500 leading-normal">Scan QR or paste signed payload string</p>
          </div>
          <Link href="/dashboard/qr/scan" className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 active:scale-95 transition-all">
            Scan QR &rarr;
          </Link>
        </div>
      </div>

      {/* Main Bottom Section: Sessions and Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Active Device Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Active Device Sessions</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded-md border border-white/5">Monitoring</span>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
            {sessionsLoading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                <span>Loading active connections...</span>
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No active sessions found.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {sessions.map((session) => (
                  <div key={session.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                        <Smartphone className="w-5 h-5 text-indigo-400/80" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">
                          {session.deviceName} <span className="text-slate-500 font-normal">({session.operatingSystem})</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          IP: <span className="text-slate-400">{session.ipAddress}</span> | Browser: <span className="text-slate-400">{session.browser}</span>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Last login: {formatDateTime(session.lastLogin)}</p>
                      </div>
                    </div>

                    <div>
                      {session.isActive ? (
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                            Active
                          </span>
                          <button 
                            onClick={() => revokeSession(session.id)}
                            disabled={isRevokingSession}
                            className="p-2 text-rose-500 hover:text-white rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                            title="Revoke session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-slate-600 border border-white/5 text-[9px] font-extrabold uppercase">
                          Revoked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Security Activity Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Activity Timeline</h3>
            </div>
            <Clock className="w-4.5 h-4.5 text-slate-500" />
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative">
            {activitiesLoading ? (
              <div className="py-8 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-2" />
                <span>Loading security log...</span>
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No recent security events registered.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex gap-4 relative">
                    {/* Bullet */}
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center shrink-0 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200">
                        {getFriendlyActivityMessage(act.action)}
                      </h4>
                      <p className="text-[10px] text-slate-500">{formatDateTime(act.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
