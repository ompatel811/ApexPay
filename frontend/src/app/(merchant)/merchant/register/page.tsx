'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { merchantService } from '@/services/merchantService';
import { Sliders, Briefcase, Mail, Phone, MapPin, FileText, ChevronRight, Loader2, Sparkles } from 'lucide-react';

export default function RegisterMerchantPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'SOLE_PROPRIETORSHIP',
    businessEmail: '',
    businessMobile: '',
    businessAddress: '',
    panNumber: '',
    gstNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Quick validations
    if (!formData.businessName || !formData.businessEmail || !formData.businessMobile || !formData.businessAddress) {
      setError('Please fill in all mandatory business identity fields.');
      return;
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.panNumber)) {
      setError('Invalid PAN number format. (Expected: 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F)');
      return;
    }

    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstNumber)) {
      setError('Invalid GST format. (Expected 15 characters, e.g. 22AAAAA1111A1Z1)');
      return;
    }

    try {
      setLoading(true);
      await merchantService.registerMerchant({
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessEmail: formData.businessEmail,
        businessMobile: formData.businessMobile,
        businessAddress: formData.businessAddress,
        panNumber: formData.panNumber || undefined,
        gstNumber: formData.gstNumber || undefined,
      });
      router.push('/merchant/kyc');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to register business account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Visual Header */}
      <div className="text-center mb-10">
        <div className="inline-flex p-3.5 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl mb-4 text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Briefcase className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Register Business Account
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Start accepting instant invoice payouts, generating QR receipts, and managing settlements globally with ApexPay.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {error}
            </div>
          )}

          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Business Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Legal Business Name *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Acme Corp Ltd"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Entity Type *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white transition-all outline-none"
                >
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PRIVATE_LIMITED">Private Limited Company</option>
                  <option value="PUBLIC_LIMITED">Public Limited Company</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Contact & Location</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="billing@acme.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business Mobile *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    name="businessMobile"
                    value={formData.businessMobile}
                    onChange={handleChange}
                    placeholder="+14155552671"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Physical Business Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="123 Financial District, San Francisco, CA"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tax Identities */}
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Compliance Registration (Tax / Legal)</h2>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Company PAN (10 characters)</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business GSTIN (15 characters)</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="22AAAAA1111A1Z1"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 rounded-2xl text-sm text-white placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-600/50 disabled:to-purple-700/50 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Provisioning Business Account...
                </>
              ) : (
                <>
                  Create Business Profile <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
