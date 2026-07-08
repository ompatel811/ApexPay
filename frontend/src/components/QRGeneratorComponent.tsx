'use client';

import React, { useState } from 'react';
import { useQR } from '@/hooks/useQR';
import { Loader2, QrCode, Download, Share2, Calendar, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QRGeneratorComponent() {
  const { generateDynamicQRAsync, generateRequestQRAsync } = useQR();
  
  const [type, setType] = useState<'DYNAMIC' | 'REQUEST'>('DYNAMIC');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [expiry, setExpiry] = useState('10'); // minutes
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<{
    qrImageBase64: string;
    referenceNumber: string;
    qrData: string;
    expirationDate: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrResult(null);

    try {
      const parsedAmount = parseFloat(amount);
      if (type === 'DYNAMIC' && (isNaN(parsedAmount) || parsedAmount <= 0)) {
        throw new Error('Please enter a valid positive amount.');
      }

      const payload = {
        qrType: type,
        amount: isNaN(parsedAmount) ? undefined : parsedAmount,
        currency: 'USD',
        remarks: remarks || undefined,
        expirationMinutes: parseInt(expiry, 10),
      };

      let response;
      if (type === 'DYNAMIC') {
        response = await generateDynamicQRAsync(payload);
      } else {
        response = await generateRequestQRAsync(payload);
      }

      if (response) {
        setQrResult({
          qrImageBase64: response.qrImageBase64,
          referenceNumber: response.referenceNumber || '',
          qrData: response.qrData,
          expirationDate: response.expirationDate || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR Code. Please check input values.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrResult) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrResult.qrImageBase64}`;
    link.download = `${type.toLowerCase()}_qr_${qrResult.referenceNumber || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Form Card */}
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
          <QrCode className="w-5 h-5 text-indigo-400" /> Configure Payment QR
        </h3>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* QR Type selection tabs */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">QR Payment Type</label>
            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => { setType('DYNAMIC'); setQrResult(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'DYNAMIC' 
                    ? 'bg-indigo-650 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dynamic QR (Invoice)
              </button>
              <button
                type="button"
                onClick={() => { setType('REQUEST'); setQrResult(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'REQUEST' 
                    ? 'bg-indigo-650 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Request QR (Split Bills)
              </button>
            </div>
          </div>

          {/* Amount field */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">
              {type === 'DYNAMIC' ? 'Payment Amount (USD) *' : 'Requested Amount (USD - Optional)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                required={type === 'DYNAMIC'}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Remarks/Message */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Remarks / Invoice Memo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={type === 'DYNAMIC' ? 'e.g. Consulting Invoice' : 'e.g. Split Dinner Bill'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Expiration Duration */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Expiration Window</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="1440">24 Hours</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Payload...
              </>
            ) : (
              'Generate Payment QR Code'
            )}
          </button>
        </form>
      </div>

      {/* Result Card */}
      <div className="flex flex-col items-center justify-center h-full">
        <AnimatePresence mode="wait">
          {qrResult ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center w-full max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-emerald-500/20 mb-4">
                Active {type} QR
              </span>

              {/* QR Image Display */}
              <div className="bg-white p-4.5 rounded-2xl shadow-xl border border-slate-700/10 mb-6">
                <img
                  src={`data:image/png;base64,${qrResult.qrImageBase64}`}
                  alt="Payment QR"
                  className="w-48 h-48 block"
                />
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-white text-xs font-bold tracking-mono">Ref: {qrResult.referenceNumber}</p>
                {amount && (
                  <p className="text-2xl font-black text-white">${parseFloat(amount).toFixed(2)} USD</p>
                )}
                {remarks && <p className="text-slate-400 text-xs italic">"{remarks}"</p>}
                <p className="text-[10px] text-slate-500">
                  Expires: {new Date(qrResult.expirationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(qrResult.qrData)}
                  className="flex-1 bg-slate-950 border border-white/5 hover:border-white/10 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy JSON
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="border-2 border-dashed border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center w-full max-w-sm h-80 text-center text-slate-500">
              <QrCode className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-400">QR Code Preview</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">Fill in configurations and generate a payment code to view preview and downloads.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
