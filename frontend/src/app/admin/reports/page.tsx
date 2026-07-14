'use client';

import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function AdminReportsPage() {
  const [type, setType] = useState('transactions');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  const handleGeneratePreview = async () => {
    try {
      setLoading(true);
      // Simulate/Generate mock tabular preview records
      setTimeout(() => {
        if (type === 'transactions') {
          setPreviewData([
            { id: '1', ref: 'APX-77382', sender: 'APXWAL_102', receiver: 'APXWAL_993', amount: 450.00, method: 'UPI', status: 'SUCCESS' },
            { id: '2', ref: 'APX-19928', sender: 'APXWAL_299', receiver: 'APXWAL_881', amount: 15.50, method: 'WALLET', status: 'SUCCESS' },
            { id: '3', ref: 'APX-88129', sender: 'APXWAL_492', receiver: 'APXWAL_092', amount: 200.00, method: 'UPI', status: 'PENDING' },
            { id: '4', ref: 'APX-66127', sender: 'APXWAL_308', receiver: 'APXWAL_772', amount: 80.00, method: 'WALLET', status: 'FAILED' },
          ]);
        } else if (type === 'merchants') {
          setPreviewData([
            { id: '1', business: 'BlueMart Groceries', email: 'billing@bluemart.com', type: 'RETAIL', status: 'APPROVED', date: '2026-07-08' },
            { id: '2', business: 'Zenith Logistics', email: 'ops@zenith.com', type: 'SERVICES', status: 'PENDING', date: '2026-07-10' },
            { id: '3', business: 'Sip & Bite Cafe', email: 'cafe@sipbite.com', type: 'FOOD', status: 'REJECTED', date: '2026-07-05' },
          ]);
        } else {
          setPreviewData([
            { id: '1', metric: 'Standard CPU Latency', value: '42ms', threshold: '50ms', status: 'HEALTHY' },
            { id: '2', metric: 'Database Connection Pool', value: '8/20 active', threshold: '15 active', status: 'HEALTHY' },
            { id: '3', metric: 'Redis Caching Hit Rate', value: '94.2%', threshold: '80%', status: 'HEALTHY' },
          ]);
        }
        setLoading(false);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await adminService.downloadReport(format, type);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${type}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-50 tracking-tight">Platform Reports Generator</h2>
        <p className="text-sm text-slate-400">Compile operational records, check data tables, and download CSV, Excel, or PDF sheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Select Report Criteria</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-450 block mb-1">Report Category</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPreviewData(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
            >
              <option value="transactions">Transaction Log Details</option>
              <option value="merchants">Merchant KYC Status List</option>
              <option value="platform">Platform Settings & Limits</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-450 block mb-1">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 font-mono"
            >
              <option value="csv">CSV (Comma Separated)</option>
              <option value="xlsx">XLSX (Microsoft Excel)</option>
              <option value="pdf">PDF Document</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleGeneratePreview}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Preview Table</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-650/10 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Compile & Download</span>
            </button>
          </div>
        </div>

        {/* Tabular Preview */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-6 overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Live Tabular Preview</span>
            </h3>

            {!previewData ? (
              <div className="text-sm text-slate-500 py-16 text-center italic">
                Select a report category and click 'Preview Table' to render raw sample rows.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 font-semibold uppercase">
                      {Object.keys(previewData[0]).filter(k => k !== 'id').map((key) => (
                        <th key={key} className="py-2 px-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {previewData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/30 transition-colors">
                        {Object.entries(row).filter(([k]) => k !== 'id').map(([_, val]: any, i) => (
                          <td key={i} className="py-2 px-3 text-slate-300 font-mono">
                            {typeof val === 'number' ? `$${val.toFixed(2)}` : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {previewData && (
            <div className="text-[10px] text-slate-500 text-right mt-4 font-mono font-bold">
              Showing top {previewData.length} records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
