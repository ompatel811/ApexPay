'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, PaymentLinkResponseData } from '@/services/merchantService';
import { 
  FileText, 
  Plus, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowUpRight, 
  Loader2, 
  Search, 
  Calendar, 
  X,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLinkResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    expiryHours: '24',
    description: '',
    customerName: '',
    customerEmail: '',
    customerMobile: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newLink, setNewLink] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await merchantService.getPaymentLinks();
      setLinks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewLink(null);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please input a valid invoice amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await merchantService.createPaymentLink({
        amount: amt,
        currency: formData.currency,
        expiryHours: parseInt(formData.expiryHours),
        description: formData.description || undefined,
        customerName: formData.customerName || undefined,
        customerEmail: formData.customerEmail || undefined,
        customerMobile: formData.customerMobile || undefined,
      });

      // Construct absolute payment checkout link
      const checkoutUrl = `${window.location.origin}/pay/${res.referenceNumber}`;
      setNewLink(checkoutUrl);
      
      // Reset form fields
      setFormData({
        amount: '',
        currency: 'USD',
        expiryHours: '24',
        description: '',
        customerName: '',
        customerEmail: '',
        customerMobile: '',
      });

      fetchLinks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create payment invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLinks = links.filter(link => {
    const text = (link.referenceNumber + link.description + link.customerName + link.customerEmail).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-500" /> Invoice Payment Links
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Generate invoice billing codes allowing clients to pay directly via wallet transfers.
          </p>
        </div>

        <button
          onClick={() => {
            setNewLink(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Invoice Link
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, or invoice reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-xl text-xs text-white outline-none placeholder-slate-600 transition-all"
          />
        </div>
      </div>

      {/* Links List */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredLinks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="py-3 font-semibold">Reference</th>
                  <th className="py-3 font-semibold">Client Info</th>
                  <th className="py-3 font-semibold">Invoice Details</th>
                  <th className="py-3 font-semibold">Amount</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Expiry Date</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLinks.map((link) => {
                  const payUrl = `${window.location.origin}/pay/${link.referenceNumber}`;
                  return (
                    <tr key={link.id} className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <td className="py-4 font-mono font-bold text-slate-400">{link.referenceNumber}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-200">{link.customerName || 'Guest Customer'}</p>
                        <p className="text-[10px] text-slate-500">{link.customerEmail || 'No email associated'}</p>
                      </td>
                      <td className="py-4 text-slate-400">{link.description || 'No description'}</td>
                      <td className="py-4 font-bold text-slate-200">{link.currency} {link.amount.toFixed(2)}</td>
                      <td className="py-4">
                        {link.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : link.status === 'EXPIRED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full font-semibold">
                            <XCircle className="w-3 h-3" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                            <Clock className="w-3 h-3 animate-pulse" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(link.expiry).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(link.id, payUrl)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                            title="Copy Payout Link"
                          >
                            {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          
                          <Link
                            href={`/pay/${link.referenceNumber}`}
                            className="p-2 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all"
                            title="Open Checkout Portal"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">
            No invoice payment links found.
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Generate Invoice Link
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Fill in client specifics below. ApexPay will automatically generate a shortcode link for checkout payments.
            </p>

            {newLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Invoice Generated Successfully</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Share the payment link below with your customer.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-white/5">
                  <input
                    type="text"
                    value={newLink}
                    readOnly
                    className="flex-1 bg-transparent text-xs text-indigo-400 font-bold border-none outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopy('new', newLink)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    {copiedId === 'new' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateLink} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="150.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Currency *</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Invoice Expiry *</label>
                    <select
                      value={formData.expiryHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryHours: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                    >
                      <option value="1">1 Hour</option>
                      <option value="6">6 Hours</option>
                      <option value="24">24 Hours</option>
                      <option value="48">48 Hours</option>
                      <option value="72">72 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Description / Note</label>
                    <input
                      type="text"
                      placeholder="E.g. Consultation Fees"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Customer Details (Optional)</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="john@doe.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">Mobile</label>
                      <input
                        type="tel"
                        placeholder="+12345678"
                        value={formData.customerMobile}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerMobile: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        Generate Shortcode Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
