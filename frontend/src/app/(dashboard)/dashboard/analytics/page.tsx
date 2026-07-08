'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, Percent, 
  ArrowUpRight, ArrowDownLeft, Clock, ShoppingCart, Award, Calendar, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_COLORS: { [key: string]: string } = {
  FOOD: '#6366f1',         // Indigo
  SHOPPING: '#ec4899',     // Pink
  TRAVEL: '#3b82f6',       // Blue
  RECHARGE: '#10b981',     // Emerald
  UTILITIES: '#f59e0b',    // Amber
  BILLS: '#8b5cf6',        // Violet
  MEDICAL: '#ef4444',      // Red
  EDUCATION: '#06b6d4',    // Cyan
  INVESTMENT: '#14b8a6',   // Teal
  ENTERTAINMENT: '#a855f7',// Purple
  SALARY: '#22c55e',       // Green
  TRANSFER: '#64748b',     // Slate
  OTHER: '#94a3b8'         // Cool Slate
};

export default function AnalyticsDashboard() {
  const { 
    useDashboardQuery, 
    useSpendingQuery, 
    useIncomeQuery, 
    useTrendsQuery 
  } = useAnalytics();

  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  const { data: dashData, isLoading: dashLoading } = useDashboardQuery();
  const { data: spendingData, isLoading: spendingLoading } = useSpendingQuery();
  const { data: incomeData, isLoading: incomeLoading } = useIncomeQuery();
  const { data: trendsData, isLoading: trendsLoading } = useTrendsQuery(period);

  const isOverallLoading = dashLoading || spendingLoading || incomeLoading || trendsLoading;

  if (isOverallLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-500 text-xs font-bold">Compiling your financial profiles...</p>
      </div>
    );
  }

  // Fallback defaults if empty
  const dashboard = dashData || {
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    highestExpense: 0,
    highestIncome: 0,
    pendingPayments: 0
  };

  const spending = spendingData || {
    dailySpending: 0,
    weeklySpending: 0,
    monthlySpending: 0,
    yearlySpending: 0,
    averageSpending: 0,
    highestSpending: 0,
    lowestSpending: 0,
    categorySpending: []
  };

  const income = incomeData || {
    dailyIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    yearlyIncome: 0,
    averageIncome: 0,
    largestIncome: 0,
    incomeSources: []
  };

  const trends = trendsData?.trends || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Analytics</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time spend aggregation, income tracking, and budget utilization profiles.</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/5 self-start">
          {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`p-1.5 px-3.5 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'DAILY' ? '7 Days' : p === 'WEEKLY' ? '4 Weeks' : '6 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Current Balance */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Current Balance</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">${dashboard.currentBalance.toFixed(2)}</h2>
          <span className="text-[9px] text-indigo-400 font-bold block mt-1">Verified Ledger Balance</span>
        </div>

        {/* Monthly Income */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Monthly Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">${dashboard.monthlyIncome.toFixed(2)}</h2>
          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Incoming Cash Flow
          </span>
        </div>

        {/* Monthly Expense */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Monthly Expense</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">${dashboard.monthlyExpense.toFixed(2)}</h2>
          <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3" /> Outgoing Cash Flow
          </span>
        </div>

        {/* Total Transactions */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">{dashboard.totalTransactions}</h2>
          <span className="text-[9px] text-amber-400 font-bold block mt-1">
            Average: ${dashboard.averageTransaction.toFixed(2)} / tx
          </span>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Income vs Expense) */}
        <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-400" /> Cash Flow Trend
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Comparison of total income generated against spending outflows.</p>
          </div>

          <div className="h-64 mt-6">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">No trend records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="debitsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    labelClassName="font-bold text-slate-400"
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Area name="Credits (In)" type="monotone" dataKey="credits" stroke="#10b981" fillOpacity={1} fill="url(#creditsGrad)" strokeWidth={2} />
                  <Area name="Debits (Out)" type="monotone" dataKey="debits" stroke="#ef4444" fillOpacity={1} fill="url(#debitsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categorical Breakdown Pie Chart */}
        <div className="lg:col-span-1 bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Percent className="w-4.5 h-4.5 text-pink-400" /> Spending Categories
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Categorical split of outbound transaction values.</p>
          </div>

          <div className="h-56 mt-4 relative flex items-center justify-center">
            {spending.categorySpending.length === 0 ? (
              <div className="text-slate-500 text-xs">No category statistics found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending.categorySpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {spending.categorySpending.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.category.toUpperCase()] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {spending.categorySpending.length > 0 && (
              <div className="absolute text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Monthly Outflow</span>
                <span className="text-base font-extrabold text-white">${spending.monthlySpending.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Categories Legend list */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto mt-4 pr-1">
            {spending.categorySpending.slice(0, 5).map((item) => {
              const color = CATEGORY_COLORS[item.category.toUpperCase()] || '#94a3b8';
              return (
                <div key={item.category} className="flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-slate-400 capitalize">{item.category.toLowerCase()}</span>
                  </div>
                  <div className="text-slate-200">
                    ${item.amount.toFixed(2)} <span className="text-slate-500">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Spending Insights & Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Spending Insights Card */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4.5 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-amber-400" /> Spending Insights
          </h3>

          <div className="space-y-3.5">
            {/* Top Category */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/20 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <ShoppingCart className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Most Used Category</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Where most of your transfers go.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-white capitalize">
                  {spending.categorySpending[0]?.category.toLowerCase() || 'None'}
                </span>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                  {spending.categorySpending[0] ? `${spending.categorySpending[0].percentage}% of total` : ''}
                </p>
              </div>
            </div>

            {/* Highest Expense */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/20 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <ArrowUpRight className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Largest Expense Single</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Highest single payment debited.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-rose-400">
                  -${dashboard.highestExpense.toFixed(2)}
                </span>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">Outbound transfer</p>
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/20 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Monthly Net Savings</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Net cash saved in the current month.</p>
                </div>
              </div>
              <div className="text-right">
                {(() => {
                  const savings = dashboard.monthlyIncome - dashboard.monthlyExpense;
                  const isPositive = savings >= 0;
                  return (
                    <>
                      <span className={`text-xs font-extrabold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}${savings.toFixed(2)}
                      </span>
                      <p className="text-[9px] text-slate-500 font-bold mt-0.5">Month Net Flow</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Income Breakdown & Details */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4.5 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-400" /> Income Analyses
            </h3>

            {income.incomeSources.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10 font-bold">No income distributions found.</p>
            ) : (
              <div className="space-y-3.5">
                {income.incomeSources.slice(0, 3).map((item) => (
                  <div key={item.source} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300">{item.source}</span>
                      <span className="text-slate-400">
                        ${item.amount.toFixed(2)} <span className="text-[9px] text-slate-500">({item.percentage}%)</span>
                      </span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Highest Credits Single</span>
              <span className="text-xs font-bold text-white">${dashboard.highestIncome.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Average Income Single</span>
              <span className="text-xs font-bold text-white">${income.averageIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


