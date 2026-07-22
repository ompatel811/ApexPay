'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, RefreshCw } from 'lucide-react';
import { chatService, ConversationResponse } from '@/services/chatService';

export default function ArchivedChatsPage() {
  const [archivedList, setArchivedList] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const data = await chatService.getArchivedConversations();
      setArchivedList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleUnarchive = async (id: string) => {
    try {
      await chatService.archiveConversation(id, false);
      fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/chat" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <Archive className="w-6 h-6 text-blue-400" />
            <span>Archived Conversations</span>
          </h2>
          <p className="text-xs text-slate-400">View and restore conversations you archived</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading archived chats...</div>
        ) : archivedList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No archived conversations found.</div>
        ) : (
          archivedList.map((conv) => (
            <div key={conv.id} className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  {conv.title.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{conv.title}</h4>
                  <p className="text-xs text-slate-400">{conv.lastMessageContent || 'No messages'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUnarchive(conv.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-semibold border border-blue-500/30 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Unarchive</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
