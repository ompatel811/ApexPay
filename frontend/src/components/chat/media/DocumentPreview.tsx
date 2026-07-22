import React from 'react';
import { FileText, Download, FileSpreadsheet, FileArchive, Presentation } from 'lucide-react';
import { MediaResponse } from '@/services/mediaService';

interface DocumentPreviewProps {
  media: MediaResponse;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ media }) => {
  const getIcon = () => {
    const ext = media.extension.toLowerCase();
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-8 h-8 text-amber-400" />;
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return <FileArchive className="w-8 h-8 text-indigo-400" />;
    return <FileText className="w-8 h-8 text-blue-400" />;
  };

  return (
    <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700/60 my-1 max-w-xs flex items-center justify-between space-x-3 shadow-md">
      <div className="flex items-center space-x-3 truncate">
        {getIcon()}
        <div className="truncate">
          <h5 className="text-xs font-semibold text-slate-100 truncate">{media.originalName}</h5>
          <span className="text-[10px] text-slate-400 uppercase font-mono">
            {media.extension} • {(media.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      </div>

      <a
        href={media.fileUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition shrink-0"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
};
