'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, MerchantProfileResponseData } from '@/services/merchantService';
import { qrService, GenerateQRCodeResponse } from '@/services/qrService';
import { QrCode, Download, Share2, DollarSign, FileText, Calendar, Loader2, Check, Copy } from 'lucide-react';

export default function MerchantQRPage() {
  const [profile, setProfile] = useState<MerchantProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STATIC' | 'DYNAMIC'>('STATIC');
  
  // Dynamic QR generator state
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [expiry, setExpiry] = useState('15');
  const [generating, setGenerating] = useState(false);
  const [dynamicQR, setDynamicQR] = useState<GenerateQRCodeResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await merchantService.getProfile();
        setProfile(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Define static QR payload data
  const staticQrData = `apexpay://pay?recipient=${profile?.walletNumber || ''}&business=${encodeURIComponent(profile?.businessName || '')}`;
  const staticQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=0-0-0&bgcolor=255-255-255&margin=15&data=${encodeURIComponent(staticQrData)}`;

  const handleGenerateDynamicQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDynamicQR(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please input a valid invoice amount.');
      return;
    }

    try {
      setGenerating(true);
      
      // Dynamic payment QR payload mapping
      const res = await qrService.generateDynamicQR({
        qrType: 'DYNAMIC',
        amount: amt,
        currency: 'USD',
        remarks: remarks || undefined,
        expirationMinutes: parseInt(expiry)
      });
      setDynamicQR(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate dynamic invoice QR.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <QrCode className="w-7 h-7 text-indigo-500" /> Business QR Gateway
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Receive touch-free customer payments instantly. Print your static storefront code or generate client-specific invoice codes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('STATIC')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'STATIC' 
              ? 'bg-indigo-650 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Static Storefront QR
        </button>
        <button
          onClick={() => setActiveTab('DYNAMIC')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'DYNAMIC' 
              ? 'bg-indigo-650 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Dynamic Invoice QR
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'STATIC' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900/40 border border-white/5 rounded-3xl p-8 shadow-xl">
          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-white/5 rounded-2xl text-center">
            <div className="bg-white p-5 rounded-2xl shadow-2xl mb-6">
              <img
                src={staticQrImageUrl}
                alt="Static Merchant QR"
                className="w-48 h-48 block"
              />
            </div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{profile?.businessName}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{profile?.walletNumber}</p>
            <p className="text-xs text-indigo-400 mt-2 font-semibold">Storefront Pay Account</p>
          </div>

          {/* Details & Actions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">How Static Storefront QR Works</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Display this code at checkout counters or on paper invoices. Customers scan this QR using their ApexPay app, enter the custom bill total manually, and complete transfers instantly.
              </p>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Raw QR Data String</span>
              <p className="text-xs font-mono text-slate-400 break-all">{staticQrData}</p>
            </div>

            <div className="flex gap-4">
              <a
                href={staticQrImageUrl}
                download={`${profile?.businessName}_static_qr.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PNG
              </a>
              <button
                onClick={() => handleCopy(staticQrData)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 border border-white/5 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied Link' : 'Copy Pay Link'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Configure Dynamic Form */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">Create Invoice QR</h3>
            
            <form onSubmit={handleGenerateDynamicQR} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Invoice Amount (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Description / Note</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Order #10852"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">QR Code Expiry Duration</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  'Generate Dynamic QR'
                )}
              </button>
            </form>
          </div>

          {/* Render Result Dynamic QR */}
          <div className="flex flex-col items-center justify-center">
            {dynamicQR ? (
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center w-full max-w-sm text-center">
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-black px-2.5 py-1 rounded-full border border-emerald-500/20 mb-4">
                  Active Invoice QR
                </span>

                <div className="bg-white p-4.5 rounded-2xl shadow-xl border border-slate-700/10 mb-6">
                  <img
                    src={`data:image/png;base64,${dynamicQR.qrImageBase64}`}
                    alt="Dynamic Payment QR"
                    className="w-48 h-48 block"
                  />
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-white text-xs font-bold tracking-mono">Ref: {dynamicQR.referenceNumber}</p>
                  <p className="text-xl font-black text-white">${parseFloat(amount).toFixed(2)} USD</p>
                  {remarks && <p className="text-slate-400 text-xs italic">"{remarks}"</p>}
                  <p className="text-[10px] text-slate-500">
                    Expires: {dynamicQR.expirationDate ? new Date(dynamicQR.expirationDate).toLocaleTimeString() : 'Short-lived'}
                  </p>
                </div>

                <div className="flex w-full gap-3">
                  <a
                    href={`data:image/png;base64,${dynamicQR.qrImageBase64}`}
                    download={`dynamic_qr_${dynamicQR.referenceNumber}.png`}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button
                    onClick={() => handleCopy(dynamicQR.qrData)}
                    className="flex-1 py-2.5 bg-slate-950 border border-white/5 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy JSON
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center w-full max-w-sm h-80 text-center text-slate-500">
                <QrCode className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-400">QR Code Preview</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">Configure and submit the invoice details on the left to generate the dynamic scan payload.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
