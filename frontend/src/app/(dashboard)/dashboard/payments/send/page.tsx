'use client';

import React, { useState, useEffect } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { useAuthStore } from '@/store/authStore';
import { SearchBeneficiary } from '@/components/SearchBeneficiary';
import { PaymentReceiptCard } from '@/components/PaymentReceiptCard';
import { TransactionTimeline } from '@/components/TransactionTimeline';
import { useWalletQuery } from '@/hooks/useWallet';
import { 
  ArrowLeft, 
  Wallet, 
  Send, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Step = 'SELECT_BENEFICIARY' | 'ENTER_AMOUNT' | 'REVIEW' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';

export default function SendMoneyPage() {
  const { user } = useAuthStore();
  const { data: wallet } = useWalletQuery();
  const { 
    sendMoneyAsync, 
    validatePaymentAsync, 
    isSending, 
    sendResponse, 
    validationResponse 
  } = usePayment();

  const [step, setStep] = useState<Step>('SELECT_BENEFICIARY');
  
  // Recipient details
  const [recipient, setRecipient] = useState<{ identifier: string; name: string; walletNumber: string } | null>(null);
  
  // Amount & Remarks
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Idempotency key
  const [idempotencyKey, setIdempotencyKey] = useState('');
  
  // Error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeline steps for the processing loader
  const [timelineSteps, setTimelineSteps] = useState<{
    label: string;
    description: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
  }[]>([
    { label: 'Authentication & Session', description: 'Checking secure credentials...', status: 'processing' },
    { label: 'Pessimistic Wallet Locking', description: 'Acquiring thread safety blocks...', status: 'pending' },
    { label: 'Balance & Limit Verification', description: 'Checking available balance caps...', status: 'pending' },
    { label: 'Double-Entry Ledger Log', description: 'Writing debit/credit audit lines...', status: 'pending' },
    { label: 'Settlement Commitment', description: 'Finalizing database transaction...', status: 'pending' }
  ]);

  // Generate idempotency key when recipient is selected
  useEffect(() => {
    if (recipient) {
      setIdempotencyKey('idemp_' + Math.random().toString(36).substring(2) + Date.now());
    }
  }, [recipient]);

  const handleRecipientSelect = (selected: typeof recipient) => {
    setRecipient(selected);
    setStep('ENTER_AMOUNT');
    setErrorMessage(null);
  };

  const handleBack = () => {
    if (step === 'ENTER_AMOUNT') {
      setRecipient(null);
      setStep('SELECT_BENEFICIARY');
    } else if (step === 'REVIEW') {
      setStep('ENTER_AMOUNT');
    }
    setErrorMessage(null);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    if (wallet && val > wallet.availableBalance) {
      setErrorMessage('Insufficient balance in your wallet.');
      return;
    }

    setErrorMessage(null);
    
    try {
      // Validate payment dry-run
      const res = await validatePaymentAsync({
        recipientIdentifier: recipient!.identifier,
        amount: val,
        remarks,
        idempotencyKey: 'dryrun_' + idempotencyKey
      });

      if (!res.valid) {
        setErrorMessage(res.message || 'Validation failed. Double check limits.');
        return;
      }

      setStep('REVIEW');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Validation service offline. Check recipient details.');
    }
  };

  const handleConfirmTransfer = async () => {
    setStep('PROCESSING');
    setErrorMessage(null);

    // Timeline simulation timing details
    const updateStep = (idx: number, status: 'pending' | 'processing' | 'success' | 'failed') => {
      setTimelineSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
    };

    try {
      // Step 0: Auth complete
      setTimeout(() => updateStep(0, 'success'), 400);

      // Step 1: Locking
      setTimeout(() => {
        updateStep(1, 'processing');
        // execute lock simulation
        setTimeout(() => updateStep(1, 'success'), 500);
      }, 500);

      // Step 2: Verification
      setTimeout(() => {
        updateStep(2, 'processing');
        setTimeout(() => updateStep(2, 'success'), 500);
      }, 1100);

      // Step 3: Ledger entries
      setTimeout(() => {
        updateStep(3, 'processing');
        setTimeout(() => updateStep(3, 'success'), 500);
      }, 1700);

      // Step 4: Commitment
      setTimeout(() => {
        updateStep(4, 'processing');
      }, 2300);

      // Real transfer trigger
      const res = await sendMoneyAsync({
        recipientIdentifier: recipient!.identifier,
        amount: parseFloat(amount),
        remarks,
        idempotencyKey
      });

      setTimeout(() => {
        updateStep(4, 'success');
        setStep('SUCCESS');
      }, 2800);

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Payment engine transfer failed.';
      setErrorMessage(msg);
      // Mark active step as failed
      setTimelineSteps(prev => prev.map(s => s.status === 'processing' ? { ...s, status: 'failed' as const } : s));
      setTimeout(() => {
        setStep('FAILURE');
      }, 1500);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet?.currency || 'USD' }).format(val);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        {step !== 'SELECT_BENEFICIARY' && step !== 'SUCCESS' && step !== 'PROCESSING' && (
          <button 
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 flex items-center justify-center text-slate-350 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-black text-white">Send Money</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time wallet-to-wallet instant settlements.</p>
        </div>
      </div>

      {/* Main Flow Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Action panels */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Select Beneficiary */}
            {step === 'SELECT_BENEFICIARY' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5"
              >
                <SearchBeneficiary onSelect={handleRecipientSelect} />
              </motion.div>
            )}

            {/* Step 2: Enter Amount */}
            {step === 'ENTER_AMOUNT' && recipient && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 space-y-6"
              >
                {/* Recipient Profile Info */}
                <div className="flex items-center gap-4 bg-slate-950/40 p-4 border border-white/5 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    {recipient.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">Recipient Target</span>
                    <span className="text-sm font-bold text-white block">{recipient.name}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{recipient.identifier}</span>
                  </div>
                </div>

                <form onSubmit={handleReview} className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Enter Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-lg font-bold text-slate-500">{wallet?.currency || 'USD'}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3 pl-14 pr-4 text-lg font-bold text-slate-200 outline-none transition-all placeholder-slate-650"
                        required
                      />
                    </div>
                  </div>

                  {/* Remarks Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Add Remarks / Message</label>
                    <input
                      type="text"
                      placeholder="What is this transfer for? (Optional)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3.5 px-4 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-2.5 items-start text-xs text-rose-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    Review Transfer &rarr;
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Review Transfer */}
            {step === 'REVIEW' && recipient && validationResponse && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 space-y-6"
              >
                <div className="text-center py-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Settlement Sum</span>
                  <h1 className="text-4xl font-black text-white mt-2">{formatCurrency(parseFloat(amount))}</h1>
                </div>

                {/* Sender/Receiver Details Grid */}
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4.5 divide-y divide-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-4 text-xs">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Recipient Account</span>
                    <div className="text-right">
                      <div className="font-bold text-white">{validationResponse.receiverName}</div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5">{validationResponse.receiverWalletNumber}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 pb-4 text-xs">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Transfer Limits Checked</span>
                    <div className="text-right text-slate-350">
                      <div>Daily Remaining: <span className="font-bold text-emerald-400">{formatCurrency(validationResponse.dailyLimitRemaining)}</span></div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Monthly Remaining: {formatCurrency(validationResponse.monthlyLimitRemaining)}</div>
                    </div>
                  </div>

                  {remarks && (
                    <div className="pt-4 text-xs">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Remarks</span>
                      <span className="text-slate-300 italic">"{remarks}"</span>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-2.5 items-start text-xs text-rose-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-slate-950 border border-white/5 hover:border-white/10 text-slate-300 text-xs font-bold py-3.5 rounded-2xl cursor-pointer active:scale-95 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirmTransfer}
                    className="flex-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Confirm & Send
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Processing Animation */}
            {step === 'PROCESSING' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-indigo-500/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white">Settling Transfer...</h3>
                  <p className="text-xs text-slate-400">Pessimistic write locking & double-entry ledger logs executing.</p>
                </div>

                <div className="w-full max-w-md">
                  <TransactionTimeline steps={timelineSteps} />
                </div>
              </motion.div>
            )}

            {/* Step 5: Success / Receipt */}
            {step === 'SUCCESS' && sendResponse && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <PaymentReceiptCard 
                  receipt={{
                    referenceNumber: sendResponse.referenceNumber,
                    transactionId: sendResponse.transactionId,
                    senderName: user?.fullName || 'You',
                    senderWalletNumber: sendResponse.senderWalletNumber,
                    receiverName: recipient?.name || 'Recipient',
                    receiverWalletNumber: sendResponse.receiverWalletNumber,
                    amount: sendResponse.amount,
                    currency: sendResponse.currency,
                    status: sendResponse.status,
                    timestamp: sendResponse.createdAt,
                    remarks: sendResponse.remarks
                  }} 
                />

                <div className="flex justify-center gap-4">
                  <Link 
                    href="/dashboard"
                    className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-650 hover:text-white text-indigo-300 text-xs font-bold px-6 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setRecipient(null);
                      setAmount('');
                      setRemarks('');
                      setStep('SELECT_BENEFICIARY');
                    }}
                    className="bg-slate-900 border border-white/5 hover:border-white/10 text-slate-200 text-xs font-bold px-6 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
                  >
                    New Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 6: Failure Screen */}
            {step === 'FAILURE' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 flex flex-col items-center justify-center py-12 space-y-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 fill-rose-950">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Transfer Refused</h3>
                  <p className="text-xs text-rose-400 font-semibold px-4 max-w-md mx-auto bg-rose-500/5 py-3 rounded-xl border border-rose-500/10 leading-relaxed">
                    {errorMessage || 'Your transaction was rolled back by the database processor.'}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep('ENTER_AMOUNT')}
                    className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold px-6 py-3.5 rounded-2xl hover:bg-indigo-650 hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    Adjust Details
                  </button>
                  <button
                    onClick={() => {
                      setRecipient(null);
                      setAmount('');
                      setRemarks('');
                      setStep('SELECT_BENEFICIARY');
                    }}
                    className="bg-slate-900 border border-white/5 hover:border-white/10 text-slate-200 text-xs font-bold px-6 py-3.5 rounded-2xl cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right column - Balance widgets & Limits info */}
        <div className="space-y-6">
          {/* Wallet Available Balance Widget */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Settlement Balance
              </span>
              <h2 className="text-3xl font-black text-white mt-3">
                {formatCurrency(wallet?.availableBalance)}
              </h2>
            </div>
            <div className="text-[9px] text-slate-500">
              No: <span className="font-mono text-slate-350">{wallet?.walletNumber}</span>
            </div>
          </div>

          {/* Limits breakdown */}
          {wallet && (
            <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
              <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Transfer Limit Safeguards</h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Daily Limit Caps</span>
                  <span className="text-slate-200 font-bold">{formatCurrency(wallet.dailyTransferLimit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Monthly Limit Caps</span>
                  <span className="text-slate-200 font-bold">{formatCurrency(wallet.monthlyTransferLimit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Security details checklist */}
          <div className="bg-slate-900/10 border border-white/5 rounded-3xl p-6 space-y-3.5 text-slate-500 text-[10px]">
            <h5 className="uppercase tracking-widest font-bold text-[9px] text-slate-400 flex items-center gap-1.5">
              🛡️ Payment Protection Policy
            </h5>
            <p className="leading-relaxed">
              Every wallet settlement runs with dual pessimistic database lock. Double-spending is mathematically prevented.
            </p>
            <p className="leading-relaxed">
              Idempotency checks protect against network timeouts and replay attempts.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
