'use client';

import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { Download, Loader2, X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: string;
}

export function ExportDialog({ isOpen, onClose, defaultType = 'transactions' }: ExportDialogProps) {
  const [format, setFormat] = useState('csv');
  const [type, setType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const blob = await adminService.downloadReport(format, type);
      
      // Create download url link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${type}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate report export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-md font-bold flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            <span>Generate & Export Report</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Report Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
            >
              <option value="transactions">Transactions Report</option>
              <option value="merchants">Merchants KYC Report</option>
              <option value="users">User Platform Logs</option>
              <option value="revenue">Platform Revenue Logs</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Download Format</label>
            <div className="grid grid-cols-3 gap-3">
              {['csv', 'xlsx', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded-lg text-xs font-bold border capitalize transition-all duration-200 ${
                    format === fmt
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {fmt === 'xlsx' ? 'Excel' : fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
