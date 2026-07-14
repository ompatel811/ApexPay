'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import {
  Settings,
  ShieldCheck,
  BellRing,
  Wallet,
  Coins,
  AppWindow,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  // Local form modifications state
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);
      
      // Map to form record
      const formMap: Record<string, string> = {};
      data.forEach((s: any) => {
        formMap[s.key] = s.value;
      });
      setForm(formMap);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    const value = form[key];
    try {
      setSavingKey(key);
      await adminService.updateSetting(key, value);
      alert(`Setting ${key} updated successfully.`);
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update setting parameters.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Group settings for visual sections
  const groupSettings = (key: string) => {
    if (key.startsWith('PLATFORM_')) return { icon: AppWindow, section: 'Platform Branding' };
    if (key.startsWith('TRANSACTION_')) return { icon: Coins, section: 'Transaction Limits' };
    if (key.startsWith('WALLET_')) return { icon: Wallet, section: 'Wallet Regulations' };
    if (key.startsWith('NOTIFICATION_')) return { icon: BellRing, section: 'Notifications Settings' };
    return { icon: ShieldCheck, section: 'Security Control Rules' };
  };

  // Group settings by section
  const sections: Record<string, any[]> = {};
  settings.forEach((s) => {
    const { section } = groupSettings(s.key);
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(s);
  });

  return (
    <div className="space-y-6 text-slate-100 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-400">Configure global transaction caps, enable maintenance modes, and adjust token policies</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(sections).map(([sectionTitle, items]) => {
          const SectionIcon = groupSettings(items[0].key).icon;
          return (
            <div key={sectionTitle} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                <SectionIcon className="h-4.5 w-4.5 text-indigo-400" />
                <span>{sectionTitle}</span>
              </h3>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 border-b border-slate-850/50 last:border-b-0">
                    <div className="md:max-w-md">
                      <span className="text-xs font-bold text-slate-200 block mb-1 font-mono uppercase text-indigo-400">
                        {item.key.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-slate-450">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-80">
                      {item.key === 'MAINTENANCE_MODE' || item.key === 'NOTIFICATION_EMAIL_ENABLED' ? (
                        <select
                          value={form[item.key] || ''}
                          onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                        >
                          <option value="true">ENABLED (True)</option>
                          <option value="false">DISABLED (False)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form[item.key] || ''}
                          onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-semibold"
                        />
                      )}

                      <button
                        onClick={() => handleSave(item.key)}
                        disabled={savingKey === item.key}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        {savingKey === item.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>Save</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
