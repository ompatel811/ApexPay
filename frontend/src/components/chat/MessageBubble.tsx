import React, { useState } from 'react';
import { Check, CheckCheck, MoreVertical, Pin, Star, Reply, Smile, Trash2, Edit3, Share2 } from 'lucide-react';
import { MessageResponse } from '@/services/chatService';
import { ReactionPicker } from './ReactionPicker';
import { DocumentPreview } from './media/DocumentPreview';
import { ImageViewer } from './media/ImageViewer';
import { VideoPlayer } from './media/VideoPlayer';

interface MessageBubbleProps {
  message: MessageResponse;
  isMe: boolean;
  onReply: (msg: MessageResponse) => void;
  onEdit: (msg: MessageResponse) => void;
  onDeleteForMe: (msgId: string) => void;
  onDeleteForEveryone: (msgId: string) => void;
  onAddReaction: (msgId: string, reaction: string) => void;
  onPin: (msgId: string, pinned: boolean) => void;
  onStar: (msgId: string, starred: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onAddReaction,
  onPin,
  onStar
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex flex-col my-1 relative group ${isMe ? 'items-end' : 'items-start'}`}>
      {/* Pinned / Starred Badge */}
      {(message.pinned || message.starred) && (
        <div className="flex items-center space-x-1 text-[10px] text-amber-400 mb-0.5 px-2">
          {message.pinned && <Pin className="w-3 h-3 fill-amber-400" />}
          {message.starred && <Star className="w-3 h-3 fill-amber-400" />}
        </div>
      )}

      {/* Main Bubble Container */}
      <div className="relative max-w-sm sm:max-w-md">
        {/* Reaction Picker Popover */}
        {showReactions && (
          <div className="absolute -top-12 z-20 left-0">
            <ReactionPicker
              onSelectReaction={(emoji) => onAddReaction(message.id, emoji)}
              onClose={() => setShowReactions(false)}
            />
          </div>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl text-sm relative shadow-md transition-all ${
            isMe
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
          } ${message.deletedForEveryone ? 'italic text-slate-400 bg-slate-850' : ''}`}
        >
          {/* Sender Name for incoming messages */}
          {!isMe && (
            <span className="block text-xs font-semibold text-blue-400 mb-1">
              {message.senderName}
            </span>
          )}

          {/* Reply Target Snippet */}
          {message.replyToContent && (
            <div className="p-2 mb-1.5 bg-black/20 border-l-2 border-amber-400 rounded text-xs text-slate-300">
              <span className="truncate block opacity-80">{message.replyToContent}</span>
            </div>
          )}

          {/* Media Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.attachments.map((att: any) => {
                const mf = att.mediaFile || att;
                const isImage = att.attachmentType === 'IMAGE' || mf.mimeType?.startsWith('image/');
                const isVideo = att.attachmentType === 'VIDEO' || mf.mimeType?.startsWith('video/');

                if (isImage) {
                  return (
                    <img
                      key={att.attachmentId || mf.id}
                      src={mf.fileUrl}
                      alt={mf.originalName}
                      onClick={() => setActiveImage(mf.fileUrl)}
                      className="max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition border border-white/10"
                    />
                  );
                }

                if (isVideo) {
                  return (
                    <video
                      key={att.attachmentId || mf.id}
                      src={mf.fileUrl}
                      controls
                      className="max-h-60 rounded-xl border border-white/10"
                    />
                  );
                }

                return <DocumentPreview key={att.attachmentId || mf.id} media={mf} />;
              })}
            </div>
          )}

          {/* Text Message Content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}

          {/* Bottom Info Bar: timestamp, edited badge, delivery/read status */}
          <div className="flex items-center justify-end space-x-1 mt-1 text-[11px] opacity-75">
            {message.edited && !message.deletedForEveryone && <span>edited</span>}
            <span>{formattedTime}</span>
            {isMe && !message.deletedForEveryone && (
              <span>
                {message.seen ? (
                  <CheckCheck className="w-4 h-4 text-emerald-300 inline" />
                ) : message.delivered ? (
                  <CheckCheck className="w-4 h-4 text-slate-300 inline" />
                ) : (
                  <Check className="w-4 h-4 text-slate-300 inline" />
                )}
              </span>
            )}
          </div>

          {/* Reactions Row */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
              {message.reactions.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-black/30 backdrop-blur-sm"
                  title={`${r.userName}: ${r.reaction}`}
                >
                  {r.reaction}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover Context Actions */}
        <div
          className={`absolute top-2 ${
            isMe ? '-left-20' : '-right-20'
          } hidden group-hover:flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-lg z-10`}
        >
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPin(message.id, !message.pinned)}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
            title="Pin"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lightbox Modals */}
      {activeImage && (
        <ImageViewer src={activeImage} onClose={() => setActiveImage(null)} />
      )}
      {activeVideo && (
        <VideoPlayer src={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
};
