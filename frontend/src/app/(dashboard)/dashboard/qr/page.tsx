'use client';

import React, { useState } from 'react';
import { useQR, useQRHistoryQuery } from '@/hooks/useQR';
import { QRGeneratorComponent } from '@/components/QRGeneratorComponent';
import { QrCode, User, PlusCircle, History, Download, Trash2, Calendar, Loader2, Link as LinkIcon, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QRConsolePage() {
  const [tab, setTab] = useState<'MY_QR' | 'GENERATE' | 'HISTORY'>('MY_QR');
  const { usePersonalQRQuery, revokeQR, isRevoking } = useQR();
  
  const { data: personalQR, isLoading: personalLoading } = usePersonalQRQuery();
  const { data: qrHistory, isLoading: historyLoading } = useQRHistoryQuery();

  const handleDownloadPersonal = () => {
    if (!personalQR) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${personalQR.qrImageBase64}`;
    link.download = `personal_qr_${personalQR.currency.toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to cancel/revoke this payment QR? Scanners will reject it immediately.')) {
      revokeQR(id);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'USED':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'EXPIRED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-white/5';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Module 7 QR System</span>
          <h1 className="text-2xl font-black text-white mt-1">QR Payment Console</h1>
          <p className="text-slate-400 text-xs mt-1">Generate dynamic invoice codes, check split bill status, or display your receipt coordinates.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setTab('MY_QR')}
          className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            tab === 'MY_QR' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Receive Money (My QR)
        </button>
        <button
          onClick={() => setTab('GENERATE')}
          className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            tab === 'GENERATE' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Create Bill QR
        </button>
        <button
          onClick={() => setTab('HISTORY')}
          className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            tab === 'HISTORY' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" /> QR History logs
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        <AnimatePresence mode="wait">
          {tab === 'MY_QR' && (
            <motion.div
              key="my_qr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-8"
            >
              {personalLoading ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-slate-500 text-xs font-semibold">Creating personal codes...</p>
                </div>
              ) : personalQR ? (
                <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center w-full max-w-sm text-center relative overflow-hidden">
                  <div className="absolute -left-16 -top-16 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <span className="bg-indigo-500/10 text-indigo-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-indigo-500/20 mb-6">
                    Static Personal QR
                  </span>

                  {/* QR Image Display */}
                  <div className="bg-white p-4.5 rounded-2xl shadow-xl border border-slate-700/10 mb-6">
                    <img
                      src={`data:image/png;base64,${personalQR.qrImageBase64}`}
                      alt="Personal QR"
                      className="w-48 h-48 block"
                    />
                  </div>

                  <div className="space-y-1 mb-8">
                    <h3 className="text-lg font-black text-white">Scan to Receive</h3>
                    <p className="text-slate-400 text-xs">Share this QR with another user on the platform. They scan, enter their desired amount, and transfer settles instantly.</p>
                  </div>

                  <button
                    onClick={handleDownloadPersonal}
                    className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download QR Code PNG
                  </button>
                </div>
              ) : (
                <p className="text-rose-400 text-xs font-bold">Failed to load personal QR. Check API status.</p>
              )}
            </motion.div>
          )}

          {tab === 'GENERATE' && (
            <motion.div
              key="generate_qr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QRGeneratorComponent />
            </motion.div>
          )}

          {tab === 'HISTORY' && (
            <motion.div
              key="qr_history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {historyLoading ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-slate-500 text-xs font-semibold">Loading history logs...</p>
                </div>
              ) : qrHistory && qrHistory.length > 0 ? (
                <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                          <th className="py-4 px-6">Reference</th>
                          <th className="py-4 px-6">QR Type</th>
                          <th className="py-4 px-6">Amount</th>
                          <th className="py-4 px-6">Created Date</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {qrHistory.map((qr) => (
                          <tr key={qr.id} className="hover:bg-white/[0.01] transition-all text-xs">
                            <td className="py-4.5 px-6 font-mono text-white font-bold">{qr.referenceNumber || 'N/A'}</td>
                            <td className="py-4.5 px-6">
                              <span className="text-slate-300 font-bold">{qr.qrType}</span>
                            </td>
                            <td className="py-4.5 px-6 font-bold text-white">
                              {qr.amount && qr.amount > 0 ? (
                                `$${qr.amount.toFixed(2)} ${qr.currency}`
                              ) : (
                                <span className="text-slate-500 italic">User Defined</span>
                              )}
                            </td>
                            <td className="py-4.5 px-6 text-slate-400">
                              {new Date(qr.createdAt).toLocaleDateString()} {new Date(qr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4.5 px-6">
                              <span className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-full ${getStatusStyle(qr.status)}`}>
                                {qr.status}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-right">
                              {qr.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleRevoke(qr.id)}
                                  disabled={isRevoking}
                                  className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1 ml-auto cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Cancel QR
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-white/5 rounded-3xl p-12 text-center text-slate-500">
                  <History className="w-12 h-12 text-slate-600 mb-3 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-400">No QR Codes Found</h4>
                  <p className="text-xs text-slate-600 mt-1">Any dynamic bill or request codes you generate will register in this history list.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
