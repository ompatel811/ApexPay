'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormInputs {
  identifier: string;
  password?: string;
}

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  const onSubmit = (data: LoginFormInputs) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-8 relative z-10"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Apex<span className="text-indigo-400">Pay</span>
        </span>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-slate-400">Sign in to manage your digital transactions securely.</p>
        </div>

        {/* Global Error Banner */}
        {loginError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex gap-2.5 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="text-rose-300/90 text-xs mt-0.5">
                {(loginError as any).response?.data?.message || 'Invalid credentials. Please verify your Email/Mobile and Password.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email / Mobile Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email or Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="email@example.com or +1234567890"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('identifier', { 
                  required: 'Email or Mobile is required',
                  minLength: { value: 3, message: 'Minimum 3 characters required' }
                })}
              />
            </div>
            {errors.identifier && (
              <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.identifier.message}
              </span>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <a href="#" className="text-xs text-indigo-400 hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
            </div>
            {errors.password && (
              <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </motion.div>

      {/* Security Status Indicator */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-600 relative z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
        <span>End-to-End Encrypted Session</span>
      </div>
    </div>
  );
}
