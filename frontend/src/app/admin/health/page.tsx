'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import {
  Activity,
  Cpu,
  Server,
  Database,
  RefreshCw,
  Signal,
  Wifi,
  HardDrive
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function AdminHealthPage() {
  const [currentHealth, setCurrentHealth] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const current = await adminService.getSystemHealth();
      setCurrentHealth(current);
      
      const hist = await adminService.getSystemHealthHistory();
      // Reverse history to have chronological order (past to present)
      setHistory(hist.reverse());
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    // Set up a dynamic polling check every 5 seconds to simulate incoming WebSocket updates
    const timer = setInterval(async () => {
      try {
        const next = await adminService.getSystemHealth();
        setCurrentHealth(next);
        setHistory((prev) => {
          const updated = [...prev, next];
          if (updated.length > 30) {
            updated.shift();
          }
          return updated;
        });
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  if (loading || !currentHealth) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Latency data mapping for Recharts
  const chartData = history.map((h, i) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Latency: h.apiResponseTimeMs,
    CPU: Math.round(h.cpuUsage),
    Memory: Math.round(h.memoryUsage),
  }));

  return (
    <div className="space-y-6 text-slate-100 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">System Health & Live Monitoring</h2>
          <p className="text-sm text-slate-400">Auditing latency, CPU performance, database queries, and socket connectivity</p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Monitors</span>
        </button>
      </div>

      {/* Dials & Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CPU Core Utilization</span>
            <Cpu className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-50">{currentHealth.cpuUsage.toFixed(1)}%</h4>
            <div className="w-full bg-slate-950 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentHealth.cpuUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Memory Heap</span>
            <HardDrive className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-50">{currentHealth.memoryUsage.toFixed(1)}%</h4>
            <div className="w-full bg-slate-950 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentHealth.memoryUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Response Latency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Response Time</span>
            <Server className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-50">{currentHealth.apiResponseTimeMs} ms</h4>
            <p className="text-[10px] text-slate-500 mt-2 font-bold font-mono">HEALTHY LIMIT &lt; 200ms</p>
          </div>
        </div>

        {/* Dynamic Nodes status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col justify-between gap-3 text-xs">
          <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Signal className="h-4 w-4 text-indigo-400" />
            <span>Connection Nodes</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-450 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> PostgreSQL</span>
              <span className="font-bold text-emerald-400">{currentHealth.databaseStatus}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-450 flex items-center gap-1.5"><Server className="h-3.5 w-3.5" /> Redis Caching</span>
              <span className="font-bold text-emerald-400">{currentHealth.redisStatus}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-450 flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> WebSockets</span>
              <span className="font-bold text-indigo-400">{currentHealth.websocketStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency History Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span>Real-time Latency Timeline (ms)</span>
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Area type="monotone" dataKey="Latency" stroke="#38bdf8" fillOpacity={1} fill="url(#colorLat)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
