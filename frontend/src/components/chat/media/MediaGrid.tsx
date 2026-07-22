import React from 'react';
import { Download, FileText, Play } from 'lucide-react';
import { AttachmentResponse } from '@/services/mediaService';

interface MediaGridProps {
  attachments: AttachmentResponse[];
  onOpenImage: (url: string) => void;
  onOpenVideo: (url: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ attachments, onOpenImage, onOpenVideo }) => {
  if (attachments.length === 0) {
    return <div className="py-12 text-center text-xs text-slate-500">No media files shared in this chat yet.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {attachments.map((att) => {
        const mf = att.mediaFile;
        const isImage = att.attachmentType === 'IMAGE';
        const isVideo = att.attachmentType === 'VIDEO';

        return (
          <div
            key={att.attachmentId}
            className="group relative bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-md aspect-square flex flex-col items-center justify-center p-2 hover:border-blue-500/50 transition cursor-pointer"
          >
            {isImage ? (
              <img
                src={mf.fileUrl}
                alt={mf.originalName}
                onClick={() => onOpenImage(mf.fileUrl)}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : isVideo ? (
              <div
                onClick={() => onOpenVideo(mf.fileUrl)}
                className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 rounded-xl relative"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600/80 flex items-center justify-center text-white shadow-lg">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 truncate max-w-[80%]">{mf.originalName}</span>
              </div>
            ) : (
              <a
                href={mf.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
              >
                <FileText className="w-8 h-8 text-blue-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200 truncate w-full">{mf.originalName}</span>
                <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">{mf.extension}</span>
              </a>
            )}

            <a
              href={mf.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        );
      })}
    </div>
  );
};
