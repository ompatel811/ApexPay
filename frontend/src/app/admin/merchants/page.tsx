'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  Eye,
  Trash2,
  X
} from 'lucide-react';

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  
  const [activeTab, setActiveTab] = useState<'merchants' | 'settlements'>('merchants');

  // KYC details drawer/modal
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [kycOpen, setKycOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'approve' | 'suspend' | 'delete';
    merchantId: string | null;
  }>({ isOpen: false, type: 'approve', merchantId: null });

  const [rejectState, setRejectState] = useState<{
    isOpen: boolean;
    merchantId: string | null;
    reason: string;
  }>({ isOpen: false, merchantId: null, reason: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const merchList = await adminService.getMerchants();
      setMerchants(merchList);
      
      const setList = await adminService.getSettlements();
      setSettlements(setList);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async () => {
    const { type, merchantId } = confirmState;
    if (!merchantId) return;

    try {
      if (type === 'approve') {
        await adminService.approveMerchant(merchantId);
      } else if (type === 'suspend') {
        await adminService.suspendMerchant(merchantId);
      } else if (type === 'delete') {
        await adminService.deleteMerchant(merchantId);
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'approve', merchantId: null });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectState.merchantId || !rejectState.reason) return;

    try {
      await adminService.rejectMerchant(rejectState.merchantId, rejectState.reason);
      fetchData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setRejectState({ isOpen: false, merchantId: null, reason: '' });
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.businessName.toLowerCase().includes(search.toLowerCase()) ||
      m.businessEmail.toLowerCase().includes(search.toLowerCase()) ||
      m.businessMobile.includes(search) ||
      (m.gstNumber && m.gstNumber.toLowerCase().includes(search.toLowerCase())) ||
      (m.panNumber && m.panNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = verificationFilter === 'ALL' || m.verificationStatus === verificationFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">Merchant & Settlements Portal</h2>
          <p className="text-sm text-slate-400">Review business KYC documents, approve verification, and monitor settlement payouts</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('merchants')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'merchants'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Merchants Registry
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'settlements'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Payout Settlements
        </button>
      </div>

      {activeTab === 'merchants' ? (
        <>
          {/* Advanced Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by business name, email, PAN/GST..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 whitespace-nowrap">KYC Status:</span>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Merchants Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-450">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
                <span>Fetching merchants database...</span>
              </div>
            ) : filteredMerchants.length === 0 ? (
              <div className="p-12 text-center text-slate-450">No merchants found matching search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                      <th className="py-3 px-6">Business</th>
                      <th className="py-3 px-6">Type</th>
                      <th className="py-3 px-6">PAN / GST</th>
                      <th className="py-3 px-6">KYC Status</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredMerchants.map((merchant) => (
                      <tr key={merchant.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{merchant.businessName}</span>
                            <span className="text-xs text-slate-400">{merchant.businessEmail}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-300 text-xs capitalize">{merchant.businessType}</td>
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col text-xs font-mono">
                            <span className="text-slate-350">GST: {merchant.gstNumber || 'N/A'}</span>
                            <span className="text-slate-450">PAN: {merchant.panNumber || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                              merchant.verificationStatus === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : merchant.verificationStatus === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            }`}
                          >
                            {merchant.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMerchant(merchant);
                                setKycOpen(true);
                              }}
                              title="Review KYC Documents"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-350 hover:text-white transition-all duration-200 text-xs font-bold"
                            >
                              <FileText className="h-4 w-4" />
                              <span>Review KYC</span>
                            </button>
                            <button
                              onClick={() =>
                                setConfirmState({ isOpen: true, type: 'suspend', merchantId: merchant.id })
                              }
                              title="Suspend Business"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-amber-500 hover:text-white transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmState({ isOpen: true, type: 'delete', merchantId: merchant.id })
                              }
                              title="Hard Delete Merchant"
                              className="p-1.5 rounded-lg bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Settlements List Tab */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-450">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
              <span>Fetching settlements records...</span>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center text-slate-450">No payouts settled yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                    <th className="py-3 px-6">Settlement ID / Reference</th>
                    <th className="py-3 px-6">Settled Amount</th>
                    <th className="py-3 px-6">Payout Method</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-xs text-indigo-400">{s.referenceNumber}</td>
                      <td className="py-3.5 px-6 font-bold text-slate-200">${s.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-6 text-slate-400 text-xs uppercase">{s.settlementType}</td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border uppercase ${
                            s.status === 'COMPLETED' || s.status === 'SETTLED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                        {s.settledAt ? new Date(s.settledAt).toLocaleString() : 'Processing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: 'approve', merchantId: null })}
        onConfirm={handleAction}
        title={
          confirmState.type === 'delete'
            ? 'Delete Merchant Account permanently?'
            : confirmState.type === 'suspend'
            ? 'Suspend Merchant Account?'
            : 'Approve Merchant Verification?'
        }
        message={
          confirmState.type === 'delete'
            ? 'WARNING: This is a destructive action that deletes the merchant business registration and their wallets permanently.'
            : confirmState.type === 'suspend'
            ? 'This suspends merchant employee accesses and settlement payout processes immediately.'
            : 'This approves the merchant KYC records and enables payment checkout and payout settlements.'
        }
        isDanger={confirmState.type === 'delete' || confirmState.type === 'suspend'}
        confirmText={
          confirmState.type === 'delete'
            ? 'Delete'
            : confirmState.type === 'suspend'
            ? 'Suspend'
            : 'Approve'
        }
      />

      {/* KYC Document Review Drawer Modal */}
      {kycOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-md font-bold text-slate-50">{selectedMerchant.businessName}</h3>
                  <span className="text-xs text-slate-400 capitalize">{selectedMerchant.businessType}</span>
                </div>
              </div>
              <button onClick={() => setKycOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 block">PAN Number</span>
                  <span className="text-slate-200 font-mono text-sm">{selectedMerchant.panNumber || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 block">GST Number</span>
                  <span className="text-slate-200 font-mono text-sm">{selectedMerchant.gstNumber || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-450 block mb-2 uppercase tracking-wider">KYC File Uploads</span>
                <div className="space-y-2">
                  {[
                    { label: 'PAN Card copy', file: selectedMerchant.panUpload },
                    { label: 'GST Certificate copy', file: selectedMerchant.gstUpload },
                    { label: 'Business Proof', file: selectedMerchant.businessProof },
                    { label: 'Identity Proof', file: selectedMerchant.identityProof },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-xs"
                    >
                      <span className="text-slate-300 font-semibold">{doc.label}</span>
                      {doc.file ? (
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-850 border border-slate-700 hover:border-slate-650 hover:bg-slate-800 text-[10px] text-slate-200 rounded font-bold transition-all"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-slate-550 italic">Not Uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedMerchant.verificationStatus === 'PENDING' && (
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setKycOpen(false);
                    setRejectState({ isOpen: true, merchantId: selectedMerchant.id, reason: '' });
                  }}
                  className="px-4 py-2 bg-red-650/15 border border-red-800 hover:bg-red-650 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Reject KYC
                </button>
                <button
                  onClick={() => {
                    setKycOpen(false);
                    setConfirmState({ isOpen: true, type: 'approve', merchantId: selectedMerchant.id });
                  }}
                  className="px-5 py-2 bg-emerald-650/15 border border-emerald-800 hover:bg-emerald-650 text-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Approve KYC
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject KYC Reason Modal */}
      {rejectState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100 text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span>Reject KYC Verification</span>
            </h3>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Rejection Reason</label>
                <textarea
                  placeholder="Input reason for rejecting this verification..."
                  value={rejectState.reason}
                  onChange={(e: any) => setRejectState({ ...rejectState, reason: e.target.value })}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectState({ isOpen: false, merchantId: null, reason: '' })}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-850 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
