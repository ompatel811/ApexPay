'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { merchantService, MerchantProfileResponseData } from '@/services/merchantService';
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';

export default function KycPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MerchantProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [kycForm, setKycForm] = useState({
    panUpload: 'docs://uploads/pan_card.pdf',
    gstUpload: 'docs://uploads/gst_certificate.pdf',
    businessProof: 'docs://uploads/incorporation_cert.pdf',
    identityProof: 'docs://uploads/owner_passport.pdf',
    addressProof: 'docs://uploads/utility_bill.pdf',
  });

  const [rejectReason, setRejectReason] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await merchantService.getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error(err);
      router.push('/merchant/register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      const updated = await merchantService.submitKyc(kycForm);
      setProfile(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit KYC documentation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateKyc = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectReason) {
      setError('Please provide a reason for rejecting the KYC.');
      return;
    }
    setError('');
    try {
      setSubmitting(true);
      const updated = await merchantService.simulateKyc({
        status,
        rejectedReason: status === 'REJECTED' ? rejectReason : undefined,
      });
      setProfile(updated);
      if (status === 'APPROVED') {
        // Redirect to dashboard on approval
        router.push('/merchant/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to run KYC simulator.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isPendingReview = profile?.verificationStatus === 'PENDING' && profile.panUpload;
  const isKycEmpty = !profile?.panUpload;

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-500" /> Compliance & KYC Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Verify your business account to unlock automated settlements, custom invoice billing, and team permissions.
        </p>
      </div>

      {/* KYC Status Banner */}
      <div className="mb-8">
        {profile?.verificationStatus === 'APPROVED' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Business Approved & Verified</h3>
                <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                  Verified on {profile.approvedDate ? new Date(profile.approvedDate).toLocaleDateString() : 'Compliance check'}.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  All systems are fully functional. Your business wallet number is <span className="font-mono text-indigo-400 font-bold">{profile.walletNumber}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/merchant/dashboard')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 shrink-0"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : profile?.verificationStatus === 'REJECTED' ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">KYC Verification Failed</h3>
                <p className="text-xs text-rose-400 mt-0.5 font-medium">
                  Reason: {profile.rejectedReason || 'Incomplete documentation submitted.'}
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Please review the feedback and submit corrected credentials below.
                </p>
              </div>
            </div>
          </div>
        ) : isPendingReview ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Verification Review In Progress</h3>
                <p className="text-xs text-amber-400 mt-0.5 font-medium">
                  Compliance review typically finishes in 1-2 banking days.
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Your files have been logged. You can use the compliance simulator panel below to test status actions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Awaiting Documentation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload copies of corporate proofs, owner identities, and banking utility receipts to start verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* KYC Upload Form */}
      {(profile?.verificationStatus === 'PENDING' && isKycEmpty) || profile?.verificationStatus === 'REJECTED' ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl mb-8">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">Submit Verification Documents</h3>
          
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Company PAN card PDF</label>
                <input
                  type="text"
                  value={kycForm.panUpload}
                  onChange={(e) => setKycForm(prev => ({ ...prev, panUpload: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">GST Certificate PDF</label>
                <input
                  type="text"
                  value={kycForm.gstUpload}
                  onChange={(e) => setKycForm(prev => ({ ...prev, gstUpload: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business Proof</label>
                <input
                  type="text"
                  value={kycForm.businessProof}
                  onChange={(e) => setKycForm(prev => ({ ...prev, businessProof: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Identity Proof (Owner)</label>
                <input
                  type="text"
                  value={kycForm.identityProof}
                  onChange={(e) => setKycForm(prev => ({ ...prev, identityProof: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Address Proof</label>
                <input
                  type="text"
                  value={kycForm.addressProof}
                  onChange={(e) => setKycForm(prev => ({ ...prev, addressProof: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-2xl font-bold transition-all text-xs"
              >
                {submitting ? 'Submitting Documents...' : 'Submit Verification Pack'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Compliance Simulation Panel */}
      {isPendingReview && (
        <div className="bg-slate-900/40 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-1.5 mb-4">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Compliance Inspector Simulator</h3>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-slate-400 text-xs mb-6">
            Test the compliance transitions. As compliance inspector, approve or reject this business request:
          </p>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold">Rejection Feedback (Required ONLY for Rejection)</label>
              <input
                type="text"
                placeholder="E.g. Incomplete GST certificate scan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-2xl text-xs text-white outline-none placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleSimulateKyc('REJECTED')}
                disabled={submitting}
                className="py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold rounded-2xl text-xs transition-all"
              >
                Reject KYC Request
              </button>

              <button
                onClick={() => handleSimulateKyc('APPROVED')}
                disabled={submitting}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/15"
              >
                Approve KYC & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
