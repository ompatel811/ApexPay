'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { merchantService, PaymentLinkResponseData } from '@/services/merchantService';
import { useAuthStore } from '@/store/authStore';
import { 
  Building, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Wallet,
  ArrowRight,
  ShieldCheck,
  Home
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;
  const { isAuthenticated, user } = useAuthStore();

  const [invoice, setInvoice] = useState<PaymentLinkResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await merchantService.getPublicInvoice(reference);
      setInvoice(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invoice details not found. Please verify reference code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reference) {
      fetchInvoice();
    }
  }, [reference]);

  const handlePayInvoice = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/pay/${reference}`);
      return;
    }

    try {
      setPaying(true);
      setError('');
      // Generate unique UUID for idempotency key
      const idempotencyKey = crypto.randomUUID();
      const res = await merchantService.payPublicInvoice(reference, idempotencyKey);
      setReceipt(res);
      
      // Re-fetch invoice details to show paid state
      await fetchInvoice();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Transaction processing failed. Please check wallet balance.');
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-slate-400 text-xs font-semibold tracking-wider">Loading Checkout Details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Gateway Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            ApexPay Gateway
          </span>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {receipt ? (
            /* Receipt Panel */
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Payment Successful</h3>
                <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-1">Invoice Settled</p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Recipient Business</span>
                  <span className="text-slate-200 font-bold">{invoice?.businessName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Transaction Reference</span>
                  <span className="font-mono text-slate-400 font-bold">{receipt?.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Amount Charged</span>
                  <span className="text-emerald-400 font-extrabold">
                    {formatCurrency(receipt?.amount || invoice?.amount || 0, receipt?.currency || invoice?.currency || 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Settled Date</span>
                  <span className="text-slate-400 font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" /> Switch to Wallet Home
              </Link>
            </div>
          ) : (
            /* Checkout Detail Panel */
            <div className="space-y-6">
              {/* Business Identity */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{invoice?.businessName}</h3>
                  <p className="text-[10px] text-indigo-400 font-bold tracking-mono mt-0.5">REF: {invoice?.referenceNumber}</p>
                </div>
              </div>

              {/* Amount Presentation */}
              <div className="py-4 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Due Payment Amount</span>
                <h2 className="text-3xl font-black text-white mt-1.5">
                  {formatCurrency(invoice?.amount || 0, invoice?.currency || 'USD')}
                </h2>
                <p className="text-slate-400 text-xs mt-2 font-medium italic">
                  "{invoice?.description || 'Invoice billing charges'}"
                </p>
              </div>

              {/* Status banner mappings */}
              {invoice?.status === 'PAID' ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  This invoice has already been paid and settled.
                </div>
              ) : invoice?.status === 'EXPIRED' ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-rose-450 text-xs font-semibold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  This invoice link has expired. Please request a new billing link from the business owner.
                </div>
              ) : (
                /* Payment Action Blocks */
                <div className="space-y-4 pt-2">
                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-2.5 text-indigo-400 text-xs font-semibold leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        Please authenticate with your ApexPay account credentials to execute this checkout payment.
                      </div>
                      <Link
                        href={`/login?redirect=/pay/${reference}`}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                      >
                        Sign In to Pay <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-950/65 border border-white/5 rounded-2xl flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none block">Logged Account</span>
                          <span className="text-xs text-slate-200 font-bold leading-tight block">@{user?.username}</span>
                        </div>
                      </div>

                      <button
                        onClick={handlePayInvoice}
                        disabled={paying}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-600/50 disabled:to-purple-700/50 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                      >
                        {paying ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" /> Debiting Wallet...
                          </>
                        ) : (
                          <>
                            Authorize Payment <ShieldCheck className="w-4.5 h-4.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
