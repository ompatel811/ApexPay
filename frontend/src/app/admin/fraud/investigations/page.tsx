'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import {
  ShieldAlert,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  FileText,
  Activity,
  Laptop,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit2,
  FolderOpen
} from 'lucide-react';

export default function InvestigationsPage() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get('alertId');

  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Update Case state
  const [caseStatus, setCaseStatus] = useState('INVESTIGATING');
  const [caseNotes, setCaseNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAlertsAndActiveCase = async () => {
    try {
      setLoading(true);
      const data = await adminService.getFraudAlerts();
      setAlerts(data);

      let targetId = alertId;
      if (!targetId && data.length > 0) {
        // Default to the first alert that is either PENDING_REVIEW or INVESTIGATING
        const active = data.find((a) => a.status === 'INVESTIGATING' || a.status === 'PENDING_REVIEW');
        targetId = active ? active.id : data[0].id;
      }

      if (targetId) {
        await loadCaseDetails(targetId);
      }
    } catch (err) {
      console.error('Failed to load investigations list', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (id: string) => {
    try {
      // Fetch details from backend
      const details = await adminService.getInvestigationDetails(id);
      setSelectedCase(details);
      setCaseStatus(details.status);
    } catch (err) {
      console.warn('Investigation record not initiated for alert. Initiating review state.', err);
      // Fallback: If no investigation record was created in database, let's create a simulated initial case detail based on the alert
      const matchingAlert = alerts.find((a) => a.id === id) || (await adminService.getFraudAlerts()).find((a) => a.id === id);
      if (matchingAlert) {
        setSelectedCase({
          id: matchingAlert.id,
          alert: matchingAlert,
          status: matchingAlert.status,
          assignedTo: 'SYSTEM',
          notes: 'Case opened. Awaiting administrator evaluation.',
          createdAt: matchingAlert.createdAt,
          updatedAt: matchingAlert.createdAt
        });
        setCaseStatus(matchingAlert.status);
      } else {
        setSelectedCase(null);
      }
    }
  };

  useEffect(() => {
    fetchAlertsAndActiveCase();
  }, [alertId]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setIsUpdating(true);
      const updated = await adminService.updateInvestigationDetails(
        selectedCase.id,
        caseStatus,
        caseNotes
      );
      setSelectedCase(updated);
      setCaseNotes('');
      alert('Investigation updated successfully');
      // reload alerts listing
      const data = await adminService.getFraudAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to update investigation case', err);
      alert('Error updating case details');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-black text-slate-50 tracking-tight flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-indigo-500" />
          <span>Fraud Investigations Case Center</span>
        </h2>
        <p className="text-sm text-slate-400">Perform deep-dives into suspicious velocities, trace transaction flows, and review histories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: List of Active Flagged Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alerts Queue</h3>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No alerts queued.</p>
            ) : (
              alerts.map((a) => {
                const isActive = selectedCase?.alert?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => loadCaseDetails(a.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-indigo-650/15 border-indigo-500 text-slate-100 shadow-md'
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        a.riskLevel === 'CRITICAL' ? 'bg-red-650 text-red-100' :
                        a.riskLevel === 'HIGH' ? 'bg-orange-655/20 text-orange-400' :
                        'bg-yellow-655/20 text-yellow-450'
                      }`}>
                        {a.riskLevel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Score: {a.riskScore}</span>
                    </div>
                    <span className="font-bold truncate text-slate-350">@{a.username || 'Anonymous'}</span>
                    <span className="text-[10px] font-medium line-clamp-1 text-slate-450">{a.reason}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Area: Case Details, Chain Audit, Timeline & Update Panel */}
        <div className="lg:col-span-3 space-y-6">
          {selectedCase ? (
            <>
              {/* Core Case header and Stats card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Investigation Case File</span>
                    <h3 className="text-lg font-black text-slate-50 tracking-tight">Case ID: {selectedCase.id.slice(0, 18).toUpperCase()}...</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Assigned to: <strong>{selectedCase.assignedTo || 'SYSTEM'}</strong> | Status: <strong className="text-indigo-400">{selectedCase.status}</strong></p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedCase.alert?.riskLevel === 'CRITICAL' ? 'bg-red-650 text-red-100' : 'bg-amber-600/10 text-amber-400'
                  }`}>
                    {selectedCase.alert?.riskLevel} THREAT RISK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Alert & Trigger context */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-indigo-400" />
                      <span>Security Violation Log</span>
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                      <p className="text-slate-200 font-medium"><strong>Violation:</strong> {selectedCase.alert?.reason}</p>
                      <p className="text-slate-400 font-mono"><strong>Risk Score Evaluated:</strong> {selectedCase.alert?.riskScore} / 100</p>
                      <p className="text-slate-400"><strong>Auto Enforced Action:</strong> <span className="font-bold text-red-400">{selectedCase.alert?.action}</span></p>
                      <p className="text-slate-400"><strong>Wallet:</strong> {selectedCase.alert?.walletNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Account Owner Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-4 w-4 text-indigo-400" />
                      <span>Violator Profile Summary</span>
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                      <p className="text-slate-200"><strong>Owner Username:</strong> @{selectedCase.alert?.username || 'N/A'}</p>
                      <p className="text-slate-400"><strong>Email ID:</strong> {selectedCase.alert?.email || 'N/A'}</p>
                      <p className="text-slate-450"><strong>Auto Trigger Time:</strong> {new Date(selectedCase.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Flow Chain visualization */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <h3 className="text-xs font-bold text-slate-350 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
                  <span>Interactive Transaction Audit Flow</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 text-center text-xs">
                  {/* Sender */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <User className="h-6 w-6 text-indigo-400 mx-auto" />
                    <span className="font-bold block truncate text-slate-205">@{selectedCase.alert?.username || 'Sender'}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Wallet: {selectedCase.alert?.walletNumber?.slice(0, 10) || 'N/A'}...</span>
                  </div>

                  {/* Flow arrow 1 */}
                  <div className="flex justify-center flex-col items-center text-slate-500 font-mono text-[10px] space-y-1">
                    <ArrowRight className="h-5 w-5 text-indigo-400 animate-pulse" />
                    <span>Sent ${selectedCase.alert?.amount?.toFixed(2) || '0.00'}</span>
                    <span>Ref: {selectedCase.alert?.transactionRef?.slice(0, 8) || 'N/A'}</span>
                  </div>

                  {/* Recipient */}
                  <div className="p-4 rounded-2xl bg-indigo-900/10 border border-indigo-500/25 space-y-1.5">
                    <Laptop className="h-6 w-6 text-indigo-400 mx-auto" />
                    <span className="font-bold block truncate text-slate-200">Recipient Node</span>
                    <span className="text-[10px] text-slate-450 block font-mono">Resolved via UPI/Wallet</span>
                  </div>

                  {/* Flow arrow 2 */}
                  <div className="flex justify-center flex-col items-center text-slate-500 font-mono text-[10px] space-y-1">
                    <ArrowRight className="h-5 w-5 text-slate-600" />
                    <span>Split / Transfer</span>
                    <span>Velocity check: ok</span>
                  </div>

                  {/* Next Node */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-1.5 opacity-60">
                    <User className="h-6 w-6 text-slate-500 mx-auto" />
                    <span className="font-bold block truncate text-slate-450">Layer 2 Recipient</span>
                    <span className="text-[10px] text-slate-600 block font-mono">Outbound Settlement</span>
                  </div>
                </div>
              </div>

              {/* Case Update Form and History logs */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                {/* Notes History logs */}
                <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>Case Investigation Timeline & Notes</span>
                  </h3>
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    <div className="border-l-2 border-slate-850 pl-4 py-2 relative">
                      <span className="absolute -left-1.5 top-3.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-slate-900"></span>
                      <p className="text-slate-450 text-[10px] font-mono">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-slate-200 font-medium">Case initiated automatically by Risk Engine.</p>
                    </div>
                    {selectedCase.notes && selectedCase.notes.split('\n\n').map((note: string, idx: number) => {
                      if (!note.trim()) return null;
                      return (
                        <div key={idx} className="border-l-2 border-indigo-900/60 pl-4 py-2 relative">
                          <span className="absolute -left-1.5 top-3.5 h-3 w-3 rounded-full bg-indigo-650 ring-4 ring-slate-900"></span>
                          <p className="text-slate-300 font-medium whitespace-pre-line text-xs">{note}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Case Update Form */}
                <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="h-4 w-4 text-indigo-400" />
                    <span>Update Case File</span>
                  </h3>
                  <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-450 font-bold uppercase tracking-wider block">Case Resolution Status</label>
                      <select
                        value={caseStatus}
                        onChange={(e) => setCaseStatus(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-205"
                      >
                        <option value="INVESTIGATING">INVESTIGATING (Keep Open)</option>
                        <option value="CLOSED_RESOLVED">CLOSED_RESOLVED (Confirm Fraud)</option>
                        <option value="CLOSED_FALSE_POSITIVE">CLOSED_FALSE_POSITIVE (Dismiss Case)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-450 font-bold uppercase tracking-wider block">Add Audit Entry Notes</label>
                      <textarea
                        required
                        placeholder="Write detailed assessment comments, verification checks performed..."
                        value={caseNotes}
                        onChange={(e) => setCaseNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl h-24 focus:outline-none focus:border-indigo-500 text-slate-205 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                    >
                      {isUpdating ? 'Saving Comments...' : 'Append Audit Comment'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-905/30 p-12 text-center text-slate-500">
              <FileText className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-xs">No active alert selected or alert queue is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
