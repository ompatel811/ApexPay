'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQR } from '@/hooks/useQR';
import { Loader2, Camera, Upload, Keyboard, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerComponentProps {
  onScanSuccess: (decodedData: any) => void;
}

export function QRScannerComponent({ onScanSuccess }: QRScannerComponentProps) {
  const { scanQRAsync, isScanning } = useQR();
  const [tab, setTab] = useState<'CAMERA' | 'FILE' | 'MANUAL'>('CAMERA');
  
  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  // File Upload state
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  // Manual input state
  const [manualText, setManualText] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop();
        }
      } catch (e) {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [tab, stopScanner]);

  const handleScannedPayload = useCallback(async (rawPayload: string) => {
    try {
      const response = await scanQRAsync({ qrString: rawPayload });
      if (response && response.valid) {
        onScanSuccess(response);
      } else {
        setCameraError('Scanned QR code is invalid or expired.');
      }
    } catch (err: any) {
      setCameraError(err.response?.data?.message || 'Failed to process QR code payload.');
    }
  }, [scanQRAsync, onScanSuccess]);

  const startScanner = async () => {
    setCameraError(null);
    setCameraActive(true);
    
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      setTimeout(() => {
        const scannerElement = document.getElementById('qr-camera-element');
        if (!scannerElement) {
          setCameraError('Camera viewport element not found in DOM.');
          setCameraActive(false);
          return;
        }

        const html5Qrcode = new Html5Qrcode('qr-camera-element');
        scannerRef.current = html5Qrcode;

        html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            stopScanner();
            handleScannedPayload(decodedText);
          },
          () => {}
        ).catch(() => {
          setCameraError('Webcam access was denied or is unavailable. Please check permissions.');
          setCameraActive(false);
        });
      }, 300);

    } catch (err: any) {
      setCameraError('Failed to initialize webcam scanner library.');
      setCameraActive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setFileUploading(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5Qrcode = new Html5Qrcode('qr-file-dummy');
      const decodedText = await html5Qrcode.scanFile(file, true);
      html5Qrcode.clear();

      await handleScannedPayload(decodedText);
    } catch (err: any) {
      setFileError('Could not decode QR code from the selected image.');
    } finally {
      setFileUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    setManualError(null);
    try {
      await handleScannedPayload(manualText.trim());
    } catch (err: any) {
      setManualError('Failed to parse manual QR string.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
      {/* Hidden container for file scanner */}
      <div id="qr-file-dummy" className="hidden" />

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => {
            stopScanner();
            setTab('CAMERA');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            tab === 'CAMERA' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Scan Camera</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopScanner();
            setTab('FILE');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            tab === 'FILE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopScanner();
            setTab('MANUAL');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            tab === 'MANUAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Enter Payload</span>
        </button>
      </div>

      {/* Tab Content 1: Camera Scanner */}
      {tab === 'CAMERA' && (
        <div className="flex flex-col items-center justify-center">
          {!cameraActive ? (
            <div className="w-full h-64 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300 mb-4">Click below to activate camera scanner</p>
              <button
                type="button"
                onClick={startScanner}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Start Camera</span>
              </button>
            </div>
          ) : (
            <div className="w-full relative">
              <div id="qr-camera-element" className="w-full rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-black min-h-[260px]" />
              <button
                type="button"
                onClick={stopScanner}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Stop Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs w-full">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: File Upload */}
      {tab === 'FILE' && (
        <div className="flex flex-col items-center justify-center">
          <label className="w-full h-64 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={fileUploading}
            />
            {fileUploading ? (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-12 h-12 text-slate-500 mb-3" />
            )}
            <p className="text-sm font-semibold text-slate-200">
              {fileUploading ? 'Decoding QR image...' : 'Click to choose QR image file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, WEBP</p>
          </label>

          {fileError && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs w-full">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Manual Input */}
      {tab === 'MANUAL' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              QR Code Payload / UPI URL String
            </label>
            <textarea
              rows={4}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. apexpay://pay?vpa=merchant@apexpay&amount=100"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {manualError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!manualText.trim() || isScanning}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Process QR Payload</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
