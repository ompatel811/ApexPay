'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  MoreVertical,
  Plus
} from 'lucide-react';

export default function FraudAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('CLOSED_RESOLVED');
  const [reviewNotes, setReviewNotes] = useState('');

  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);
  const [blacklistType, setBlacklistType] = useState('IP');
  const [blacklistValue, setBlacklistValue] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [whitelistType, setWhitelistType] = useState('WALLET');
  const [whitelistValue, setWhitelistValue] = useState('');
  const [whitelistDesc, setWhitelistDesc] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await adminService.getFraudAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load fraud alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    try {
      await adminService.reviewFraudAlert({
        alertId: selectedAlert.id,
        status: reviewStatus,
        notes: reviewNotes
      });
      setIsReviewOpen(false);
      setSelectedAlert(null);
      setReviewNotes('');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to review alert', err);
      alert('Error reviewing alert');
    }
  };

  const handleBlacklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.blockEntity({
        type: blacklistType,
        itemValue: blacklistValue,
        reason: blacklistReason
      });
      setIsBlacklistOpen(false);
      setBlacklistValue('');
      setBlacklistReason('');
      alert('Entity blacklisted successfully');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to blacklist entity', err);
      alert('Error blacklisting entity');
    }
  };

  const handleWhitelistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.whitelistEntity({
        type: whitelistType,
        itemValue: whitelistValue,
        description: whitelistDesc
      });
      setIsWhitelistOpen(false);
      setWhitelistValue('');
      setWhitelistDesc('');
      alert('Entity whitelisted successfully');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to whitelist entity', err);
      alert('Error whitelisting entity');
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.walletNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.transactionRef && alert.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRisk = riskFilter === 'ALL' || alert.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">Fraud Prevention Alerts</h2>
          <p className="text-sm text-slate-400">Audit rule violations, trigger investigations, and freeze assets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBlacklistOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-red-650/10"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Blacklist Node</span>
          </button>
          <button
            onClick={() => setIsWhitelistOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-650/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Whitelist Node</span>
          </button>
          <button
            onClick={fetchAlerts}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search username, wallet, reference, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          />
        </div>

        {/* Risk Level Filter */}
        <div className="w-full md:w-48 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs focus:outline-none text-slate-300"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs focus:outline-none text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">PENDING REVIEW</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CLOSED_RESOLVED">RESOLVED</option>
            <option value="CLOSED_FALSE_POSITIVE">FALSE POSITIVE</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Risk Evaluation</th>
                <th className="p-4">Violator Details</th>
                <th className="p-4">Rule Violation Reason</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Trigger Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-450">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto mb-2" />
                    Scanning database...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No fraud alerts found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2.5 py-0.5 rounded text-[10px] font-black tracking-tight ${
                          alert.riskLevel === 'CRITICAL' ? 'bg-red-650 text-red-100 border border-red-500/20' :
                          alert.riskLevel === 'HIGH' ? 'bg-orange-655/10 text-orange-400 border border-orange-550/20' :
                          alert.riskLevel === 'MEDIUM' ? 'bg-yellow-655/10 text-yellow-450 border border-yellow-550/20' :
                          'bg-emerald-655/10 text-emerald-400'
                        }`}>
                          {alert.riskLevel}
                        </span>
                        <span className="text-[10px] text-slate-450 font-semibold font-mono">Score: {alert.riskScore}/100</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-205">@{alert.username || 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">W: {alert.walletNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="space-y-1">
                        <p className="text-slate-300 font-medium line-clamp-2">{alert.reason}</p>
                        {alert.transactionRef && (
                          <span className="inline-block text-[10px] text-indigo-400 font-mono bg-indigo-500/5 px-2 py-0.5 rounded">
                            TxRef: {alert.transactionRef}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        alert.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        alert.status === 'INVESTIGATING' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        alert.status === 'CLOSED_RESOLVED' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {alert.status.replace('CLOSED_', '')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-450 font-mono">
                      {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setIsReviewOpen(true);
                            setReviewStatus(alert.status === 'PENDING_REVIEW' ? 'INVESTIGATING' : alert.status);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => router.push(`/admin/fraud/investigations?alertId=${alert.id}`)}
                          className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Timeline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-50 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-indigo-400" />
                <span>Review Alert Assessment</span>
              </h3>
              <button onClick={() => { setIsReviewOpen(false); setSelectedAlert(null); }} className="text-slate-400 hover:text-slate-100">&times;</button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Set Case Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                  <option value="INVESTIGATING">INVESTIGATING (Assign Case)</option>
                  <option value="CLOSED_RESOLVED">CLOSED_RESOLVED (True Violator)</option>
                  <option value="CLOSED_FALSE_POSITIVE">CLOSED_FALSE_POSITIVE (Dismiss Warning)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Audit Log Comments</label>
                <textarea
                  required
                  placeholder="Provide investigation details or context for this alert status update..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl h-24 focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsReviewOpen(false); setSelectedAlert(null); }}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {isBlacklistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-red-400 flex items-center gap-1.5">
                <Lock className="h-5 w-5" />
                <span>Blacklist Block Node</span>
              </h3>
              <button onClick={() => setIsBlacklistOpen(false)} className="text-slate-400 hover:text-slate-100">&times;</button>
            </div>
            <form onSubmit={handleBlacklistSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Target Node Type</label>
                <select
                  value={blacklistType}
                  onChange={(e) => setBlacklistType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                  <option value="IP">IP Address</option>
                  <option value="DEVICE">Device Fingerprint</option>
                  <option value="USER">User Username</option>
                  <option value="WALLET">Wallet Number</option>
                  <option value="MERCHANT">Merchant ID</option>
                  <option value="UPI">UPI Handle</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Item Value to Block</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.1 or APXWAL_7728..."
                  value={blacklistValue}
                  onChange={(e) => setBlacklistValue(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Reason for Block</label>
                <textarea
                  required
                  placeholder="Specify violation, high frequency attempt, duplicate reference..."
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl h-20 focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBlacklistOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                >
                  Enforce Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Whitelist Modal */}
      {isWhitelistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-emerald-450 flex items-center gap-1.5">
                <Plus className="h-5 w-5" />
                <span>Whitelist Trust Node</span>
              </h3>
              <button onClick={() => setIsWhitelistOpen(false)} className="text-slate-400 hover:text-slate-100">&times;</button>
            </div>
            <form onSubmit={handleWhitelistSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Node Type</label>
                <select
                  value={whitelistType}
                  onChange={(e) => setWhitelistType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                  <option value="WALLET">Wallet Number</option>
                  <option value="MERCHANT">Merchant ID</option>
                  <option value="DEVICE">Device Fingerprint</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Trust Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APXWAL_9921..."
                  value={whitelistValue}
                  onChange={(e) => setWhitelistValue(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  required
                  placeholder="Describe why this wallet/device is trusted (e.g. Verified Corporate Wallet)..."
                  value={whitelistDesc}
                  onChange={(e) => setWhitelistDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl h-20 focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWhitelistOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
                >
                  Confirm Trust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
