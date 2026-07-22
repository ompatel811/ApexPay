import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface FileUploadItem {
  file: File;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
  errorMsg?: string;
}

interface UploadDialogProps {
  items: FileUploadItem[];
  onClose: () => void;
  onUploadAll: () => void;
  isUploading: boolean;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ items, onClose, onUploadAll, isUploading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-1">Upload Shared Files</h3>
        <p className="text-xs text-slate-400 mb-4">{items.length} file(s) selected for upload</p>

        <div className="max-h-64 overflow-y-auto space-y-3 mb-6 custom-scrollbar pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 truncate mr-2">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="truncate">
                  <h4 className="font-semibold text-slate-100 truncate">{item.file.name}</h4>
                  <span className="text-[10px] text-slate-400">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {item.status === 'UPLOADING' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                {item.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {item.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span className="text-[10px] font-mono text-slate-300">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-2xl border border-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUploadAll}
            disabled={isUploading || items.length === 0}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload Files</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
