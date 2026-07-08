'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [tab]);

  const startScanner = async () => {
    setCameraError(null);
    setCameraActive(true);
    
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Delay initialization slightly to ensure the element is in the DOM
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
            // Success
            stopScanner();
            handleScannedPayload(decodedText);
          },
          (errorMessage) => {
            // Keep scanning, silent logging
          }
        ).catch((err) => {
          setCameraError('Webcam access was denied or is unavailable. Please check permissions.');
          setCameraActive(false);
        });
      }, 300);

    } catch (err: any) {
      setCameraError('Failed to initialize webcam scanner library.');
      setCameraActive(false);
    }
  };

  const stopScanner = () => {
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
  };

  const handleScannedPayload = async (rawPayload: string) => {
    try {
      const response = await scanQRAsync({ qrString: rawPayload });
      if (response && response.valid) {
        onScanSuccess(response);
      } else {
        alert(response?.message || 'QR Validation check failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed. This QR code signature may be tampered or expired.');
    }
  };

  // Drag and Drop Image Scan
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    setFileError(null);
    setFileUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        if (!base64Data) {
          setFileError('Failed to read image file.');
          setFileUploading(false);
          return;
        }

        try {
          const response = await scanQRAsync({ qrImageBase64: base64Data });
          if (response && response.valid) {
            onScanSuccess(response);
          } else {
            setFileError(response?.message || 'Invalid QR Code Image.');
          }
        } catch (err: any) {
          setFileError(err.message || 'Decoder failure. Ensure the QR is clear.');
        } finally {
          setFileUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFileError('Error loading file.');
      setFileUploading(false);
    }
  };

  // Manual payload paste submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualText.trim()) {
      setManualError('Payload text cannot be empty.');
      return;
    }

    try {
      const response = await scanQRAsync({ qrString: manualText.trim() });
      if (response && response.valid) {
        onScanSuccess(response);
      } else {
        setManualError(response?.message || 'Payload rejected. Verify signature integrity.');
      }
    } catch (err: any) {
      setManualError(err.message || 'Signature check failed. Payload might be tampered.');
    }
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden max-w-lg mx-auto">
      <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Scanner Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-white/5 mb-6">
        <button
          onClick={() => { setTab('CAMERA'); stopScanner(); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'CAMERA' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> Live Camera
        </button>
        <button
          onClick={() => { setTab('FILE'); stopScanner(); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'FILE' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Image
        </button>
        <button
          onClick={() => { setTab('MANUAL'); stopScanner(); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'MANUAL' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Paste Payload
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-72 flex flex-col items-center justify-center">
        {tab === 'CAMERA' && (
          <div className="w-full text-center">
            {cameraActive ? (
              <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-black aspect-square max-w-xs mx-auto">
                <div id="qr-camera-element" className="w-full h-full" />
                <button
                  onClick={stopScanner}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-rose-650 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 shadow-lg transition-all cursor-pointer"
                >
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Webcam Scan Access</h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto mb-6">
                  Click below to enable live scanner. Align the recipient's QR code within the framing box.
                </p>
                {cameraError && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold max-w-xs mx-auto mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {cameraError}
                  </div>
                )}
                <button
                  onClick={startScanner}
                  className="bg-indigo-650 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Activate Webcam
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'FILE' && (
          <div className="w-full">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-white/5 hover:border-white/10 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-950 cursor-pointer h-64 relative"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {fileUploading || isScanning ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                  <p className="text-white text-xs font-semibold">Decoding QR Code...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-900 border border-white/5 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Drag & Drop Image</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Drop a PNG/JPG file containing the payment QR code here, or click to browse.
                  </p>
                </>
              )}
            </div>
            {fileError && (
              <p className="text-rose-400 text-xs text-center font-semibold mt-4">{fileError}</p>
            )}
          </div>
        )}

        {tab === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="w-full space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Signed Payload String</label>
              <textarea
                rows={5}
                placeholder='{"userId": "...", "walletId": "...", "type": "...", "signature": "..."}'
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono resize-none"
              />
            </div>

            {manualError && (
              <p className="text-rose-400 text-xs font-semibold">{manualError}</p>
            )}

            <button
              type="submit"
              disabled={isScanning}
              className="w-full bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-xs"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Signatures...
                </>
              ) : (
                'Validate Payload'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
