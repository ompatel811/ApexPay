'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { adminService } from '@/services/adminService';
import { ShieldCheck, Lock, User, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAdminAuth } = useAdminAuthStore();
  
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.usernameOrEmail || !form.password) {
      setError('Please provide all credentials');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await adminService.login(form);
      setAdminAuth(data.profile, data.accessToken);
      
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password. Please verify.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Decorative Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-slate-50 uppercase">ApexPay Operations</h2>
          <p className="text-sm text-slate-400">Sign in to control platform settings & accounts</p>
        </div>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/60 text-red-400 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Username or Email</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="admin"
                  value={form.usernameOrEmail}
                  onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Security Key Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying identity...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
