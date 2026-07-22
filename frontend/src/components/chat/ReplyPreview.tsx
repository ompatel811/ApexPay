import React from 'react';
import { X, Reply } from 'lucide-react';
import { MessageResponse } from '@/services/chatService';

interface ReplyPreviewProps {
  message: MessageResponse;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onCancel }) => {
  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-800/90 border-l-4 border-blue-500 rounded-r-lg mb-2 shadow-sm">
      <div className="flex items-center space-x-2 text-xs text-slate-300 overflow-hidden">
        <Reply className="w-4 h-4 text-blue-400 shrink-0" />
        <div>
          <span className="font-semibold text-blue-400 block">{message.senderName}</span>
          <span className="text-slate-400 truncate block max-w-xs">{message.content}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
