'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Images, Search } from 'lucide-react';
import { mediaService, AttachmentResponse } from '@/services/mediaService';
import { MediaGrid } from '@/components/chat/media/MediaGrid';
import { ImageViewer } from '@/components/chat/media/ImageViewer';
import { VideoPlayer } from '@/components/chat/media/VideoPlayer';

export default function SharedMediaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversationId');

  const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      mediaService.getConversationMedia(conversationId)
        .then((data) => setAttachments(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [conversationId]);

  const filteredAttachments = attachments.filter((att) => {
    if (filterType === 'ALL') return true;
    return att.attachmentType === filterType;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Images className="w-6 h-6 text-blue-400" />
              <span>Shared Media & Files</span>
            </h1>
            <p className="text-xs text-slate-400">View photos, videos, and documents shared in conversation</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading media gallery...</div>
      ) : (
        <MediaGrid
          attachments={filteredAttachments}
          onOpenImage={(url) => setActiveImage(url)}
          onOpenVideo={(url) => setActiveVideo(url)}
        />
      )}

      {/* Lightbox Modals */}
      {activeImage && (
        <ImageViewer src={activeImage} onClose={() => setActiveImage(null)} />
      )}
      {activeVideo && (
        <VideoPlayer src={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
