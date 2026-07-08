'use client';

import React, { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { X, Bell, CreditCard, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotification() {
  const { activeToast, clearToast } = useNotificationStore();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, clearToast]);

  const getToastStyle = (type: string) => {
    if (type.includes('SUCCESS') || type.includes('LINKED') || type.includes('ACCEPTED')) {
      return {
        bg: 'bg-slate-900/95 border-emerald-500/30 shadow-emerald-950/20',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        icon: CheckCircle2
      };
    }
    if (type.includes('FAILED') || type.includes('REJECTED')) {
      return {
        bg: 'bg-slate-900/95 border-rose-500/30 shadow-rose-950/20',
        iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        icon: X
      };
    }
    if (type.includes('ALERT')) {
      return {
        bg: 'bg-slate-900/95 border-amber-500/30 shadow-amber-950/20',
        iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        icon: ShieldAlert
      };
    }
    return {
      bg: 'bg-slate-900/95 border-indigo-500/30 shadow-indigo-950/20',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      icon: Bell
    };
  };

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none max-w-sm w-full p-4 flex flex-col items-end gap-2">
      <AnimatePresence>
        {activeToast && (() => {
          const style = getToastStyle(activeToast.notificationType);
          const Icon = style.icon;

          return (
            <motion.div
              initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md shadow-xl ${style.bg}`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${style.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-tight leading-snug">
                  {activeToast.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
                  {activeToast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={clearToast}
                className="p-1 -mr-1 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all self-start"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
