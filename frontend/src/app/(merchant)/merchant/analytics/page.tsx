'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, MerchantAnalyticsResponseData } from '@/services/merchantService';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Loader2, 
  CheckCircle, 
  Coins, 
  Percent,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';

export default function MerchantAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MerchantAnalyticsResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await merchantService.getAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Convert 100 base to string percent
  const formatPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Activity className="w-7 h-7 text-indigo-500" /> Business Analytics
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Detailed sales trends, average order metrics, checkout conversion indicators, and monthly volume reports.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Ticket Size</span>
            <h3 className="text-2xl font-black text-white mt-1.5">{formatCurrency(analytics?.averageOrderValue || 0)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Mean value per verified invoice payout.</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checkout Conversion</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1.5">{formatPercent(analytics?.paymentSuccessRate || 0)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Rate of successfully cleared invoice checkouts.</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performance Rating</span>
            <h3 className="text-2xl font-black text-purple-400 mt-1.5">Optimal</h3>
            <p className="text-[10px] text-slate-400 mt-1">Risk score verified within low compliance bounds.</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5" /> Daily Sales Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.revenueTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="label" stroke="#94a3b8 text-slate-500" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8 text-slate-500" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Volume Bar Chart */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Users className="w-4.5 h-4.5" /> Client Growth Trends
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.customerTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Revenues Comparison Chart */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">6-Month Billing Volume</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
