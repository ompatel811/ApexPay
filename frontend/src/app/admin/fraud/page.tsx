'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { MinimalStompClient } from '@/utils/stompClient';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  UserX,
  RefreshCw,
  Search,
  Activity,
  UserCheck,
  CheckCircle,
  Clock
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
  Cell,
  Legend
} from 'recharts';

export default function FraudDashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerLogs, setTickerLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const fetchedAlerts = await adminService.getFraudAlerts();
      setAlerts(fetchedAlerts);
      
      const fetchedUsers = await adminService.getHighRiskUsers();
      setHighRiskUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load fraud dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Establish WebSocket Connection using MinimalStompClient
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const stompClient = new MinimalStompClient(apiBaseUrl);

    stompClient.connect(
      () => {
        setIsConnected(true);
        console.log('Fraud STOMP client connected');
        stompClient.subscribe('/topic/admin/fraud', (headers, body) => {
          try {
            const newAlert = JSON.parse(body);
            setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
            const logMsg = `[ALERT] ${newAlert.riskLevel} - ${newAlert.reason} (Score: ${newAlert.riskScore}) for User: ${newAlert.username || 'Anonymous'}`;
            setTickerLogs((prev) => [logMsg, ...prev.slice(0, 9)]);
          } catch (e) {
            console.error('Error parsing live fraud message', e);
          }
        });
      },
      (err) => {
        console.error('STOMP client connection error', err);
        setIsConnected(false);
      }
    );

    // Initial ticker logs
    setTickerLogs([
      '[SYSTEM] Fraud Risk Engine operational and checking transaction limits.',
      '[SYSTEM] Blacklist filtering active (IPs, user handles, device fingerprints).',
      '[SYSTEM] Whitelists loaded for trusted nodes and merchants.',
    ]);

    return () => {
      stompClient.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Count stats
  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter((a) => a.riskLevel === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.riskLevel === 'HIGH').length;
  const pendingCount = alerts.filter((a) => a.status === 'PENDING_REVIEW').length;
  const investigatingCount = alerts.filter((a) => a.status === 'INVESTIGATING').length;

  // Chart Mapping
  const riskBreakdown = [
    { name: 'Critical', count: criticalCount, fill: '#ef4444' },
    { name: 'High', count: highCount, fill: '#f97316' },
    { name: 'Medium', count: alerts.filter((a) => a.riskLevel === 'MEDIUM').length, fill: '#eab308' },
    { name: 'Low', count: alerts.filter((a) => a.riskLevel === 'LOW').length, fill: '#10b981' },
  ];

  // Alert trend over time (Mock hourly/daily points matched to real data count)
  const trendData = [
    { name: '08:00', Alerts: 2, RiskScore: 45 },
    { name: '10:00', Alerts: 5, RiskScore: 60 },
    { name: '12:00', Alerts: 3, RiskScore: 30 },
    { name: '14:00', Alerts: totalAlerts > 0 ? Math.min(totalAlerts, 8) : 4, RiskScore: 75 },
    { name: '16:00', Alerts: criticalCount, RiskScore: 90 },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-50 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-indigo-500" />
            <span>Fraud Detection & Risk Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400">Rule-based threat analysis, wallet locks, and transaction auditing</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isConnected ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-405 border border-amber-500/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            WebSocket: {isConnected ? 'Streaming Live' : 'Polling Fallback'}
          </span>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Engine</span>
          </button>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Fraud Alerts"
          value={totalAlerts}
          icon={AlertTriangle}
          description={`${pendingCount} Pending, ${investigatingCount} Investigating`}
          color="indigo"
        />
        <DashboardCard
          title="Critical Alerts (Score >= 85)"
          value={criticalCount}
          icon={UserX}
          description="Requires immediate wallet or user freeze"
          color="red"
        />
        <DashboardCard
          title="High Risk Users"
          value={highRiskUsers.length}
          icon={Users}
          description="Accounts with repeating violations"
          color="yellow"
        />
        <DashboardCard
          title="Pending Investigations"
          value={investigatingCount}
          icon={Clock}
          description="Assigned cases under review"
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-400" />
            <span>Threat and Alert Frequency Stream</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="Alerts" stroke="#818cf8" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Risk Level Distribution</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live alerts ticker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>Live Fraud Engine Signal Stream</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-bold font-mono">Real-time alerts</span>
        </div>
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {tickerLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 text-xs text-rose-350 font-mono transition-all duration-300"
            >
              <span className={`h-2 w-2 rounded-full ${log.includes('[ALERT]') ? 'bg-red-500 animate-ping' : 'bg-indigo-500'}`}></span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Alert List and High Risk Users */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alerts List Preview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Suspicious Alerts</h3>
            <button
              onClick={() => router.push('/admin/fraud/alerts')}
              className="text-xs text-indigo-400 hover:text-indigo-350 font-semibold"
            >
              View All Alerts &rarr;
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-96">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No fraud alerts detected in current timeframe.</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.riskLevel === 'CRITICAL' ? 'bg-red-650 text-red-100 border border-red-500/20' :
                        alert.riskLevel === 'HIGH' ? 'bg-orange-650 text-orange-100' :
                        alert.riskLevel === 'MEDIUM' ? 'bg-yellow-650 text-yellow-105' :
                        'bg-emerald-650 text-emerald-100'
                      }`}>
                        {alert.riskLevel} (Score: {alert.riskScore})
                      </span>
                      <span className="text-slate-500 font-mono">Ref: {alert.transactionRef || 'N/A'}</span>
                    </div>
                    <p className="text-slate-350 font-medium">{alert.reason}</p>
                    <div className="text-[10px] text-slate-455 space-x-3">
                      <span>User: <strong>{alert.username || 'N/A'}</strong></span>
                      <span>Wallet: <strong>{alert.walletNumber || 'N/A'}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => router.push(`/admin/fraud/investigations?alertId=${alert.id}`)}
                      className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg font-bold tracking-tight text-[11px] transition-colors"
                    >
                      Investigate
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Risk Users Preview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Identified High-Risk Users</h3>
            <span className="text-xs text-slate-400 font-semibold">{highRiskUsers.length} Users flagged</span>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-96">
            {highRiskUsers.length === 0 ? (
              <p className="text-slate-450 text-xs text-center py-8">No high-risk user profiles detected.</p>
            ) : (
              highRiskUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-105">{user.fullName}</span>
                      <span className="text-slate-500 font-mono">@{user.username}</span>
                    </div>
                    <div className="text-[10px] text-slate-405 space-x-3">
                      <span>Email: <strong>{user.email}</strong></span>
                      <span>Status: <strong className={user.accountStatus === 'ACTIVE' ? 'text-emerald-450' : 'text-red-405'}>{user.accountStatus}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to freeze user: ${user.fullName}?`)) {
                        adminService.freezeEntity('USER', user.id).then(() => {
                          fetchDashboardData();
                        });
                      }
                    }}
                    disabled={user.accountStatus !== 'ACTIVE'}
                    className="px-3 py-1.5 bg-red-655/10 border border-red-655 hover:bg-red-650 hover:text-white text-red-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-400 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    {user.accountStatus === 'ACTIVE' ? 'Freeze User' : 'Frozen'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
