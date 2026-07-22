import React from 'react';
import { VolumeX, Pin, Archive } from 'lucide-react';
import { ConversationResponse } from '@/services/chatService';
import { OnlineBadge } from './OnlineBadge';
import { UnreadBadge } from './UnreadBadge';

interface ConversationCardProps {
  conversation: ConversationResponse;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, isActive, onSelect }) => {
  const otherParticipant = conversation.participants.find((p) => p.role !== 'CREATOR');
  const isOnline = otherParticipant?.online || false;

  const formattedTime = conversation.lastMessageTime
    ? new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-150 border ${
        isActive
          ? 'bg-blue-600/15 border-blue-500/40 shadow-sm'
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700/60'
      }`}
    >
      {/* Avatar with Online status */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
          {conversation.avatarUrl ? (
            <img src={conversation.avatarUrl} alt={conversation.title} className="w-full h-full rounded-full object-cover" />
          ) : (
            conversation.title.substring(0, 2).toUpperCase()
          )}
        </div>
        <OnlineBadge online={isOnline} className="absolute bottom-0 right-0" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-slate-100 truncate">{conversation.title}</h4>
          <span className="text-[11px] text-slate-400 shrink-0 ml-2">{formattedTime}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 truncate max-w-[180px]">
            {conversation.lastMessageContent || 'No messages yet'}
          </p>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            {conversation.muted && <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            {conversation.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
            <UnreadBadge count={conversation.unreadCount} />
          </div>
        </div>
      </div>
    </div>
  );
};
