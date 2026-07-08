'use client';

import React, { useState, useEffect } from 'react';
import { useUpi } from '@/hooks/useUpi';
import { useBankAccount } from '@/hooks/useBankAccount';
import { useAuthStore } from '@/store/authStore';
import { 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  QrCode, 
  Loader2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpiManagementPage() {
  const { user } = useAuthStore();
  const { useBankAccountsQuery } = useBankAccount();
  const { data: bankAccounts = [] } = useBankAccountsQuery();

  const {
    useUpiIdsQuery,
    useCreateUpiMutation,
    useSetDefaultUpiMutation,
    useDeleteUpiMutation,
    useUpiRequestsQuery,
    usePayUsingUpiMutation,
    useRequestMoneyMutation,
    useAcceptRequestMutation,
    useRejectRequestMutation,
  } = useUpi();

  const { data: upiIds = [], isLoading: isUpiLoading } = useUpiIdsQuery();
  const { data: upiRequests = [], isLoading: isRequestsLoading } = useUpiRequestsQuery();

  const createUpi = useCreateUpiMutation();
  const setDefaultUpi = useSetDefaultUpiMutation();
  const deleteUpi = useDeleteUpiMutation();
  const payUsingUpi = usePayUsingUpiMutation();
  const requestMoney = useRequestMoneyMutation();
  const acceptRequest = useAcceptRequestMutation();
  const rejectRequest = useRejectRequestMutation();

  // State Management
  const [upiHandle, setUpiHandle] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Pay Form State
  const [paySenderUpi, setPaySenderUpi] = useState('');
  const [payRecipientUpi, setPayRecipientUpi] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Collect Request Form State
  const [collectRequesterUpi, setCollectRequesterUpi] = useState('');
  const [collectPayerUpi, setCollectPayerUpi] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectRemarks, setCollectRemarks] = useState('');
  const [collectError, setCollectError] = useState('');
  const [collectSuccess, setCollectSuccess] = useState('');

  // Active default states mapping
  useEffect(() => {
    if (upiIds.length > 0) {
      const primaryUpi = upiIds.find((u) => u.isPrimary) || upiIds[0];
      setPaySenderUpi(primaryUpi.upiId);
      setCollectRequesterUpi(primaryUpi.upiId);
    }
  }, [upiIds]);

  const handleCreateUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (bankAccounts.length === 0) {
      setCreateError('You must link a bank account before creating a UPI ID.');
      return;
    }

    if (!upiHandle.trim()) {
      setCreateError('UPI handle cannot be empty.');
      return;
    }

    if (!/^[a-zA-Z0-9.\-_]+$/.test(upiHandle)) {
      setCreateError('Handle can only contain alphanumeric characters, dots, hyphens, and underscores.');
      return;
    }

    createUpi.mutate(
      { upiHandle: upiHandle.trim().toLowerCase() },
      {
        onSuccess: (data) => {
          setCreateSuccess(`UPI ID ${data.upiId} created successfully!`);
          setUpiHandle('');
        },
        onError: (err: any) => {
          setCreateError(err.response?.data?.message || 'Failed to create UPI ID. Handle might be taken.');
        },
      }
    );
  };

  const handlePayUsingUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!paySenderUpi || !payRecipientUpi || !payAmount) {
      setPayError('Please fill out all payment fields.');
      return;
    }

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('Please enter a valid amount.');
      return;
    }

    const idempotencyKey = `UPI-${UUID_Generator()}`;

    payUsingUpi.mutate(
      {
        senderUpi: paySenderUpi,
        recipientUpi: payRecipientUpi.trim().toLowerCase(),
        amount: amt,
        remarks: payRemarks,
        idempotencyKey,
      },
      {
        onSuccess: (tx) => {
          setPaySuccess(`Payment of $${tx.amount} successful! Ref: ${tx.referenceNumber}`);
          setPayRecipientUpi('');
          setPayAmount('');
          setPayRemarks('');
        },
        onError: (err: any) => {
          setPayError(err.response?.data?.message || 'Payment execution failed.');
        },
      }
    );
  };

  const handleRequestMoney = (e: React.FormEvent) => {
    e.preventDefault();
    setCollectError('');
    setCollectSuccess('');

    if (!collectRequesterUpi || !collectPayerUpi || !collectAmount) {
      setCollectError('Please fill out all request fields.');
      return;
    }

    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      setCollectError('Please enter a valid amount.');
      return;
    }

    requestMoney.mutate(
      {
        requesterUpi: collectRequesterUpi,
        payerUpi: collectPayerUpi.trim().toLowerCase(),
        amount: amt,
        remarks: collectRemarks,
      },
      {
        onSuccess: (req) => {
          setCollectSuccess(`Collect request for $${req.amount} sent to ${req.payerUpi}!`);
          setCollectPayerUpi('');
          setCollectAmount('');
          setCollectRemarks('');
        },
        onError: (err: any) => {
          setCollectError(err.response?.data?.message || 'Failed to submit collect request.');
        },
      }
    );
  };

  const handleAcceptRequest = (requestId: string) => {
    const key = `ACC-${UUID_Generator()}`;
    acceptRequest.mutate(
      { requestId, idempotencyKey: key },
      {
        onSuccess: (tx) => {
          alert(`Payment of $${tx.amount} to accepted requester successful! Ref: ${tx.referenceNumber}`);
        },
        onError: (err: any) => {
          alert(err.response?.data?.message || 'Failed to accept payment request.');
        },
      }
    );
  };

  const UUID_Generator = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const incomingRequests = upiRequests.filter((r) => r.payerId === user?.id && r.status === 'PENDING');
  const outgoingRequests = upiRequests.filter((r) => r.requesterId === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">UPI IDs & Simulated Payments</h1>
        <p className="text-slate-400 text-xs mt-1">Manage multiple custom UPI addresses, send money, and process collect requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: UPI ID Management */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Create UPI Card */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
              <PlusCircle className="w-4.5 h-4.5 text-indigo-400" /> Create Custom UPI ID
            </h3>
            
            {bankAccounts.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>You must link a bank account on the <b>Bank Accounts</b> page before creating a UPI ID handle.</span>
              </div>
            ) : (
              <form onSubmit={handleCreateUpi} className="space-y-3">
                {createError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}
                {createSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{createSuccess}</span>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="custom.handle"
                    value={upiHandle}
                    onChange={(e) => setUpiHandle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-4 pr-24 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">
                    @apexpay
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={createUpi.isPending}
                  className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 font-bold text-xs rounded-xl transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {createUpi.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Handle'}
                </button>
              </form>
            )}
          </div>

          {/* List UPI IDs */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Your UPI Handles</h3>
            
            {isUpiLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : upiIds.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No UPI IDs configured yet.</p>
            ) : (
              <div className="space-y-2.5">
                {upiIds.map((upi) => (
                  <div 
                    key={upi.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/20 transition-all ${
                      upi.isPrimary ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate font-mono">{upi.upiId}</p>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{upi.status}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!upi.isPrimary && (
                        <button
                          onClick={() => setDefaultUpi.mutate(upi.id)}
                          className="p-1 px-2 text-[9px] bg-slate-950 border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/25 rounded-md font-bold transition-all cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                      {upi.isPrimary && (
                        <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this UPI handle?')) {
                            deleteUpi.mutate(upi.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payments & Collect Requests */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pay using UPI Form */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
                  <ArrowUpRight className="w-4.5 h-4.5 text-emerald-400" /> Send Money using UPI
                </h3>
                
                <form onSubmit={handlePayUsingUpi} className="space-y-3">
                  {payError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{payError}</span>
                    </div>
                  )}
                  {paySuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{paySuccess}</span>
                    </div>
                  )}

                  {/* Sender UPI */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pay From (UPI ID)</label>
                    <select
                      value={paySenderUpi}
                      onChange={(e) => setPaySenderUpi(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      {upiIds.map((u) => (
                        <option key={u.id} value={u.upiId}>
                          {u.upiId} {u.isPrimary ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recipient UPI */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pay To (Recipient UPI ID)</label>
                    <input
                      type="text"
                      placeholder="recipient@apexpay"
                      value={payRecipientUpi}
                      onChange={(e) => setPayRecipientUpi(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount ($)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remarks (Optional)</label>
                    <input
                      type="text"
                      placeholder="Dinner, utilities, etc."
                      value={payRemarks}
                      onChange={(e) => setPayRemarks(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={payUsingUpi.isPending || upiIds.length === 0}
                    className="w-full mt-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-bold text-xs rounded-xl transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {payUsingUpi.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Pay Instantly
                  </button>
                </form>
              </div>
            </div>

            {/* Collect Request Money Form */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
                  <ArrowDownLeft className="w-4.5 h-4.5 text-indigo-400" /> Collect Request Money
                </h3>

                <form onSubmit={handleRequestMoney} className="space-y-3">
                  {collectError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{collectError}</span>
                    </div>
                  )}
                  {collectSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{collectSuccess}</span>
                    </div>
                  )}

                  {/* Requester UPI */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Request To (Your UPI ID)</label>
                    <select
                      value={collectRequesterUpi}
                      onChange={(e) => setCollectRequesterUpi(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      {upiIds.map((u) => (
                        <option key={u.id} value={u.upiId}>
                          {u.upiId} {u.isPrimary ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payer UPI */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Request From (Payer UPI ID)</label>
                    <input
                      type="text"
                      placeholder="payer@apexpay"
                      value={collectPayerUpi}
                      onChange={(e) => setCollectPayerUpi(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount ($)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remarks / Bill Notes</label>
                    <input
                      type="text"
                      placeholder="Shared Dinner bill etc."
                      value={collectRemarks}
                      onChange={(e) => setCollectRemarks(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={requestMoney.isPending || upiIds.length === 0}
                    className="w-full mt-2 p-2.5 bg-slate-950 border border-white/5 hover:border-white/10 hover:bg-slate-900 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-bold text-xs rounded-xl transition-all text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {requestMoney.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                    Request Collect
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Pending Incoming Collect Requests Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Pending Requests Received</h3>
            
            {isRequestsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No pending money requests received.</p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-950/20 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{req.requesterName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({req.requesterUpi})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Requested <span className="font-extrabold text-indigo-400">${req.amount}</span>. Remarks: "{req.remarks || 'None'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          if (confirm(`Approve debit of $${req.amount} to transfer to ${req.requesterName}?`)) {
                            handleAcceptRequest(req.id);
                          }
                        }}
                        disabled={acceptRequest.isPending}
                        className="p-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] rounded-lg transition-all text-white flex items-center gap-1 cursor-pointer"
                      >
                        {acceptRequest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Accept & Pay
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Decline this money request?')) {
                            rejectRequest.mutate(req.id);
                          }
                        }}
                        disabled={rejectRequest.isPending}
                        className="p-1.5 px-3.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/10 hover:border-rose-500/20 font-bold text-[10px] rounded-lg transition-all text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        {rejectRequest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests History Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Requests Sent Status</h3>
            
            {isRequestsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No collect requests sent.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/10 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">Request to {req.payerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.payerUpi} • ${req.amount}</p>
                    </div>
                    
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase flex items-center gap-1 ${
                      req.status === 'ACCEPTED' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {req.status === 'PENDING' ? <Clock className="w-2.5 h-2.5" /> : req.status === 'ACCEPTED' ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
