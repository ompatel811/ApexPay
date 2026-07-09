'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, MerchantProfileResponseData } from '@/services/merchantService';
import { 
  Settings, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2, 
  CheckCircle,
  Building
} from 'lucide-react';

export default function BusinessSettingsPage() {
  const [profile, setProfile] = useState<MerchantProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessMobile: '',
    businessAddress: '',
    businessLogo: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await merchantService.getProfile();
        setProfile(data);
        setFormData({
          businessName: data.businessName || '',
          businessEmail: data.businessEmail || '',
          businessMobile: data.businessMobile || '',
          businessAddress: data.businessAddress || '',
          businessLogo: data.businessLogo || '',
        });
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.businessName || !formData.businessEmail || !formData.businessMobile || !formData.businessAddress) {
      setError('Please fill out all required details.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await merchantService.updateProfile({
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessMobile: formData.businessMobile,
        businessAddress: formData.businessAddress,
        businessLogo: formData.businessLogo || undefined,
      });
      setProfile(updated);
      setSuccess('Business profile settings updated successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update business settings.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" /> Business Profile Settings
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Manage your business identity specifications, email contacts, and billing office addresses.
        </p>
      </div>

      {/* Settings Form Card */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {success}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Entity Specifications</h3>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Legal Business Name *</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Business Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    name="businessMobile"
                    value={formData.businessMobile}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Physical Office Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Business Logo URL (Optional)</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="businessLogo"
                  placeholder="https://acme.com/logo.png"
                  value={formData.businessLogo}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={updating}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile Configurations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
