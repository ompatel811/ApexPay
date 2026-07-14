'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { DashboardCard } from '@/components/admin/DashboardCard';
import {
  Users,
  Store,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  Activity,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tickerLogs, setTickerLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');

  const fetchData = async () => {
    try {
      setLoading(true);
      const metrics = await adminService.getDashboardData();
      setData(metrics);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Mock WebSocket Logs Ticker & Status
    setWsStatus('CONNECTED');
    const logs = [
      'Super Admin logged in from IP 192.168.1.100',
      'System health check status: healthy',
      'Platform setting TRANSACTION_LIMIT updated',
      'KYC Review approved for merchant: BlueMart Inc.',
      'User wallet unfrozen: APXWAL_7728',
      'Announcement broadcast: Maintenance scheduled next Sunday at 02:00 UTC',
    ];
    setTickerLogs(logs);

    // Simulate incoming real-time ticks
    const interval = setInterval(() => {
      const liveEvents = [
        'New user user_' + Math.floor(Math.random() * 900 + 100) + ' registered',
        'Transaction completed: Ref APX-' + Date.now().toString().slice(-6) + ' (Amount: $' + (Math.random() * 200 + 10).toFixed(2) + ')',
        'KYC Documents submitted by business: Zenith Payments',
        'System alert: High API Response Time on deposits endpoint',
        'Wallet frozen: APXWAL_' + Math.floor(Math.random() * 9000 + 1000) + ' (Security Lock)',
      ];
      const randomEvent = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      setTickerLogs((prev) => [randomEvent, ...prev.slice(0, 9)]);
      
      // Randomly adjust stats to show live dashboard updates
      setData((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          todayTransactions: prev.todayTransactions + 1,
          platformBalance: prev.platformBalance + (Math.random() * 50 + 5),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Chart Mocks
  const revenueTrendData = [
    { name: 'Mon', Revenue: 1200, Volume: 15000 },
    { name: 'Tue', Revenue: 1900, Volume: 22000 },
    { name: 'Wed', Revenue: 1600, Volume: 19000 },
    { name: 'Thu', Revenue: 2300, Volume: 31000 },
    { name: 'Fri', Revenue: 3400, Volume: 45000 },
    { name: 'Sat', Revenue: 2900, Volume: 38000 },
    { name: 'Sun', Revenue: 3800, Volume: 48000 },
  ];

  const walletGrowthData = [
    { name: 'Jan', Wallets: 400 },
    { name: 'Feb', Wallets: 900 },
    { name: 'Mar', Wallets: 1500 },
    { name: 'Apr', Wallets: 2300 },
    { name: 'May', Wallets: 3800 },
    { name: 'Jun', Wallets: 5100 },
  ];

  const transactionBreakdown = [
    { name: 'UPI IDs', value: data.upiPayments, color: '#6366f1' },
    { name: 'QR Codes', value: data.qrPayments, color: '#10b981' },
    { name: 'Wallet Direct', value: Math.max(0, data.todayTransactions - data.upiPayments - data.qrPayments), color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-50 tracking-tight">Operations Dashboard</h2>
          <p className="text-sm text-slate-400">Real-time platform performance indicators and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            WS Ticker: {wsStatus}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Platform Users"
          value={data.totalUsers}
          icon={Users}
          description={`${data.activeUsers} Active, ${data.blockedUsers} Blocked`}
          color="indigo"
        />
        <DashboardCard
          title="Today's Transaction Volume"
          value={data.todayTransactions}
          icon={ArrowLeftRight}
          description={`${data.pendingTransactions} Pending, ${data.failedTransactions} Failed`}
          color="blue"
        />
        <DashboardCard
          title="Simulated Revenue (0.5%)"
          value={`$${data.totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          description="0.5% standard fee rate applied"
          trend="up"
          change="+12.4%"
          color="green"
        />
        <DashboardCard
          title="Platform Vault Balance"
          value={`$${data.platformBalance.toFixed(2)}`}
          icon={Wallet}
          description="Sum of all user wallet deposits"
          color="yellow"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Revenue & Volume Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Share */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Payments Method Share</h3>
          <div className="flex-1 h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionBreakdown}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {transactionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live activity logs ticker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>Live System Activity Stream</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-bold font-mono">Updates automatically</span>
        </div>

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {tickerLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 text-xs text-slate-300 font-mono transition-all duration-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
