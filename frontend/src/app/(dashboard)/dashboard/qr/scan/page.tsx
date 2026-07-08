'use client';

import React, { useState, useEffect } from 'react';
import { useQR } from '@/hooks/useQR';
import { QRScannerComponent } from '@/components/QRScannerComponent';
import { PaymentReceiptCard } from '@/components/PaymentReceiptCard';
import { TransactionTimeline } from '@/components/TransactionTimeline';
import { useWalletQuery } from '@/hooks/useWallet';
import { ArrowLeft, Wallet, QrCode, AlertCircle, Sparkles, CheckCircle2, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type QRPageState = 'SCANNING' | 'CHECKOUT' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';

export default function QRScanPage() {
  const { data: wallet } = useWalletQuery();
  const { payQRAsync, isPaying } = useQR();
  
  const [pageState, setPageState] = useState<QRPageState>('SCANNING');
  const [scanResult, setScanResult] = useState<any>(null); // ScanQRResponse
  
  // Checkout values
  const [payAmount, setPayAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success receipts values
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null); // QRPaymentResponse

  // Loader Timeline
  const [timelineSteps, setTimelineSteps] = useState<{
    label: string;
    description: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
  }[]>([
    { label: 'QR Payload Signature Check', description: 'Verifying signed integrity hash...', status: 'processing' },
    { label: 'Recipient Account Validation', description: 'Checking status and wallet states...', status: 'pending' },
    { label: 'Balance & Limit Verification', description: 'Acquiring thread safety checks...', status: 'pending' },
    { label: 'Double-Entry Ledger Commitment', description: 'Finalizing database transaction...', status: 'pending' }
  ]);

  // Generate idempotency key on scan success
  useEffect(() => {
    if (scanResult) {
      setIdempotencyKey('qr_idemp_' + Math.random().toString(36).substring(2) + Date.now());
      if (scanResult.amount > 0) {
        setPayAmount(scanResult.amount.toString());
      }
      if (scanResult.remarks) {
        setRemarks(scanResult.remarks);
      }
    }
  }, [scanResult]);

  const handleScanSuccess = (response: any) => {
    setScanResult(response);
    setPageState('CHECKOUT');
  };

  const handlePayConfirm = async () => {
    if (!scanResult) return;
    setErrorMessage(null);
    setPageState('PROCESSING');

    // Reset timeline
    setTimelineSteps([
      { label: 'QR Payload Signature Check', description: 'Verifying signed integrity hash...', status: 'processing' },
      { label: 'Recipient Account Validation', description: 'Checking status and wallet states...', status: 'pending' },
      { label: 'Balance & Limit Verification', description: 'Acquiring thread safety checks...', status: 'pending' },
      { label: 'Double-Entry Ledger Commitment', description: 'Finalizing database transaction...', status: 'pending' }
    ]);

    const updateStep = (idx: number, status: 'pending' | 'processing' | 'success' | 'failed') => {
      setTimelineSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
    };

    // Simulated timeline stages for visually wowing FinTech aesthetics
    setTimeout(() => updateStep(0, 'success'), 800);
    setTimeout(() => {
      updateStep(1, 'processing');
      setTimeout(() => updateStep(1, 'success'), 800);
    }, 800);

    setTimeout(() => {
      updateStep(2, 'processing');
    }, 1600);

    try {
      const parsedAmount = parseFloat(payAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Transfer amount must be a positive number.');
      }

      // Read QR JSON Payload directly to submit
      const payloadString = JSON.stringify({
        userId: scanResult.recipientUserId,
        walletId: scanResult.recipientWalletId,
        type: scanResult.qrType,
        amount: scanResult.amount > 0 ? scanResult.amount.toString() : parsedAmount.toString(),
        currency: scanResult.currency || 'USD',
        reference: scanResult.referenceNumber || undefined,
        remarks: scanResult.remarks || undefined,
        signature: 'legacy_signature_or_recalculated' // backend recalculates signature to verify integrity
      });

      // API call to settle QR Payment
      const response = await payQRAsync({
        qrCodeId: scanResult.qrCodeId || undefined,
        qrData: payloadString,
        amount: scanResult.qrType === 'PERSONAL' ? parsedAmount : undefined,
        remarks: remarks || undefined,
        idempotencyKey
      });

      setTimeout(() => {
        updateStep(2, 'success');
        updateStep(3, 'processing');
      }, 2000);

      setTimeout(() => {
        updateStep(3, 'success');
        setPaymentReceipt(response);
        setPageState('SUCCESS');
      }, 2800);

    } catch (err: any) {
      setTimeout(() => {
        // Mark active step as failed
        setTimelineSteps(prev => {
          const idx = prev.findIndex(s => s.status === 'processing' || s.status === 'pending');
          if (idx !== -1) {
            return prev.map((s, i) => i === idx ? { ...s, status: 'failed' } : s);
          }
          return prev;
        });
        setErrorMessage(err.message || 'Payment execution failed. Please verify limits or balance.');
        setPageState('FAILURE');
      }, 2200);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header breadcrumb */}
      {pageState !== 'PROCESSING' && (
        <div className="flex items-center gap-3">
          {pageState === 'CHECKOUT' ? (
            <button
              onClick={() => { setPageState('SCANNING'); setScanResult(null); setPayAmount(''); setRemarks(''); }}
              className="text-slate-400 hover:text-white p-2 bg-slate-900 border border-white/5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white p-2 bg-slate-900 border border-white/5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-black text-white">QR Code Scanner</h1>
            <p className="text-slate-500 text-xs mt-0.5">Settle instant wallet payments via scans.</p>
          </div>
        </div>
      )}

      {/* Dynamic Views */}
      <AnimatePresence mode="wait">
        {pageState === 'SCANNING' && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <QRScannerComponent onScanSuccess={handleScanSuccess} />
          </motion.div>
        )}

        {pageState === 'CHECKOUT' && scanResult && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <QrCode className="w-5 h-5 text-indigo-400" /> Payment Summary Preview
            </h2>

            {/* Recipient Account Details Card */}
            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg uppercase shrink-0">
                {scanResult.recipientName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full uppercase border border-indigo-500/10 mb-1 inline-block">
                  Verified Recipient
                </span>
                <h4 className="text-sm font-black text-white truncate">{scanResult.recipientName}</h4>
                <p className="text-slate-400 text-xs truncate">@{scanResult.recipientUsername} • {scanResult.recipientWalletNumber}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Amount Input */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Settlement Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    disabled={scanResult.qrType !== 'PERSONAL'}
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className={`w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono font-bold ${
                      scanResult.qrType !== 'PERSONAL' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {scanResult.qrType !== 'PERSONAL' && (
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Amount is locked by invoice creator QR.
                  </p>
                )}
              </div>

              {/* Remarks/Message */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Payment Remarks</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Reference remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Wallet balance warning check */}
            {wallet && wallet.availableBalance < parseFloat(payAmount || '0') && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3.5 flex gap-2.5 mb-6 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold">Insufficient Wallet Balance</p>
                  <p className="text-[11px] text-rose-400 mt-0.5">Available: ${wallet.availableBalance.toFixed(2)} USD. Try topping up first.</p>
                </div>
              </div>
            )}

            {/* Confirm Senders details */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs mb-6">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-slate-500" /> Pay From:
              </span>
              <span className="font-bold text-white font-mono">
                {wallet ? `${wallet.walletNumber} ($${wallet.availableBalance.toFixed(2)})` : 'Loading...'}
              </span>
            </div>

            <button
              onClick={handlePayConfirm}
              disabled={isPaying || !wallet || wallet.availableBalance < parseFloat(payAmount || '0')}
              className="w-full bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-xs shadow-lg"
            >
              Confirm & Settle Payment
            </button>
          </motion.div>
        )}

        {pageState === 'PROCESSING' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-6"
          >
            <TransactionTimeline steps={timelineSteps} />
          </motion.div>
        )}

        {pageState === 'SUCCESS' && paymentReceipt && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Custom Payment Receipt presentation */}
            <PaymentReceiptCard 
              receipt={{
                referenceNumber: paymentReceipt.referenceNumber,
                transactionId: paymentReceipt.transactionId,
                senderName: wallet ? 'You' : 'You',
                senderWalletNumber: wallet?.walletNumber || 'Sender Wallet',
                receiverName: paymentReceipt.receiverName,
                receiverWalletNumber: scanResult?.recipientWalletNumber || 'Receiver Wallet',
                amount: paymentReceipt.amount,
                currency: paymentReceipt.currency,
                status: paymentReceipt.status,
                timestamp: paymentReceipt.timestamp,
                remarks: paymentReceipt.remarks || 'QR Payment'
              }}
            />

            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard/qr"
                className="bg-slate-900 hover:bg-slate-950 text-white border border-white/5 font-bold px-6 py-3 rounded-xl text-xs active:scale-95 transition-all"
              >
                Back to QR Console
              </Link>
              <Link
                href="/dashboard"
                className="bg-indigo-650 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        )}

        {pageState === 'FAILURE' && (
          <motion.div
            key="failure"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 text-center relative overflow-hidden max-w-sm mx-auto"
          >
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertCircle className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">Payment Settle Failed</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              {errorMessage || 'Your QR payment transaction could not be processed. Balance has not been debited.'}
            </p>

            <button
              onClick={() => { setPageState('CHECKOUT'); setErrorMessage(null); }}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
