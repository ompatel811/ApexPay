'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Globe, 
  Clock, 
  Moon, 
  Sun, 
  Smartphone, 
  Check, 
  Lock, 
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    pushNotifications: false,
    securityAlerts: true,
    marketingEmails: false,
  });

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs({ ...notifs, [key]: !notifs[key] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white">Account Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure your display theme, language localizations, and alert preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Navigation Tabs (Dummy Layout) */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-3 p-3 px-4 bg-indigo-650/10 text-indigo-300 rounded-2xl text-sm font-semibold border border-indigo-500/15 cursor-pointer">
            <Settings className="w-4.5 h-4.5" /> General Settings
          </div>
          <div className="flex items-center gap-3 p-3 px-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-medium cursor-not-allowed opacity-60">
            <Lock className="w-4.5 h-4.5" /> Password & Keys
          </div>
          <div className="flex items-center gap-3 p-3 px-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-medium cursor-not-allowed opacity-60">
            <Bell className="w-4.5 h-4.5" /> Alert Logs
          </div>
        </div>

        {/* Right Settings Form Container */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Theme Configuration */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex gap-2 items-center text-sm font-bold text-white mb-4 uppercase tracking-wider">
              <Sun className="w-4.5 h-4.5 text-indigo-400" /> Theme Configuration
            </div>
            <p className="text-xs text-slate-500 mb-4">Choose how you want ApexPay to look on your device.</p>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light', name: 'Light', icon: Sun },
                { id: 'dark', name: 'Dark', icon: Moon },
                { id: 'system', name: 'System', icon: Smartphone }
              ].map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      active 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-white font-semibold' 
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 2. Localization Configuration (Structure Only) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex gap-2 items-center text-sm font-bold text-white mb-4 uppercase tracking-wider">
              <Globe className="w-4.5 h-4.5 text-indigo-400" /> Localization & Clock
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Language Preference</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-650 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    defaultValue="en-US"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    disabled
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="fr-FR">French (France)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Time Zone Mapping</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-650 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    defaultValue="UTC"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    disabled
                  >
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="EST">Eastern Standard Time (EST)</option>
                    <option value="IST">Indian Standard Time (IST)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Notification Preferences (UI Only) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex gap-2 items-center text-sm font-bold text-white mb-4 uppercase tracking-wider">
              <Bell className="w-4.5 h-4.5 text-indigo-400" /> Notification settings
            </div>
            <p className="text-xs text-slate-500 mb-6">Enforce how and when you receive transaction receipts and alerts.</p>
            
            <div className="space-y-4">
              {[
                { key: 'emailAlerts', title: 'Email Alerts', desc: 'Receive HTML transaction summaries to your registered email' },
                { key: 'pushNotifications', title: 'Push Notifications', desc: 'Alert notifications on screen for transfers and login checks' },
                { key: 'securityAlerts', title: 'Security Alerts', desc: 'Receive instant notifications on passwords or device modifications (Highly Recommended)' },
                { key: 'marketingEmails', title: 'Marketing Communications', desc: 'Periodic notifications about new reward opportunities' },
              ].map((item) => {
                const checked = notifs[item.key as keyof typeof notifs];
                return (
                  <div key={item.key} className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                    
                    <button
                      onClick={() => toggleNotif(item.key as keyof typeof notifs)}
                      className={`w-10 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        checked ? 'bg-indigo-600' : 'bg-slate-950 border border-white/5'
                      }`}
                    >
                      <div 
                        className={`w-4 h-4 rounded-full bg-white transition-all ${
                          checked ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
