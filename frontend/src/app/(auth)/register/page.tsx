'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CreditCard, User, Mail, Phone, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth, RegisterPayload } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterPayload>();

  const password = watch('password');

  const onSubmit = (data: RegisterPayload) => {
    registerUser(data);
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

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-lg bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-sm text-slate-400">Join ApexPay today for fast, secure, and borderless transactions.</p>
        </div>

        {/* Global Error Banner */}
        {registerError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex gap-2.5 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="text-rose-300/90 text-xs mt-0.5">
                {(registerError as any).response?.data?.message || 'A user with this username, email, or mobile number already exists.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</label>
              <input
                type="text"
                placeholder="johndoe"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
              />
              {errors.username && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.username.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                })}
              />
              {errors.email && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
              <input
                type="text"
                placeholder="+1234567890"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('mobileNumber', { 
                  required: 'Mobile is required',
                  pattern: { value: /^\+?[1-9]\d{1,14}$/, message: 'Please provide a valid E.164 number (e.g. +1234567890)' }
                })}
              />
              {errors.mobileNumber && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.mobileNumber.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
              {errors.password && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-6"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Onboarding...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In
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
