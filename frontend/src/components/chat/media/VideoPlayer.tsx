import React from 'react';
import { X, Download } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition shadow-lg"
          title="Download Video"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center">
        <video
          src={src}
          controls
          autoPlay
          className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-slate-800"
        />
      </div>
    </div>
  );
};
