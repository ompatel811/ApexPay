import React, { useState } from 'react';
import { Plus, Archive, ShieldAlert, Users } from 'lucide-react';
import { ConversationResponse, SearchResponse, chatService } from '@/services/chatService';
import { ConversationCard } from './ConversationCard';
import { SearchBox } from './SearchBox';
import Link from 'next/link';

interface ChatSidebarProps {
  conversations: ConversationResponse[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      try {
        const res = await chatService.searchAll(val);
        setSearchResults(res);
      } catch (err) {
        console.error('Search error', err);
      }
    } else {
      setSearchResults(null);
    }
  };

  const displayedConversations = searchResults
    ? searchResults.conversations
    : conversations;

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-slate-950 border-r border-slate-800/80 p-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
            A
          </div>
          <h2 className="text-lg font-bold text-slate-100">ApexPay Chat</h2>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition"
          title="New Conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <SearchBox value={searchQuery} onChange={handleSearchChange} />
      </div>

      {/* Navigation Quick Links */}
      <div className="flex items-center space-x-2 mb-4 text-xs font-medium text-slate-400 border-b border-slate-800 pb-3">
        <span className="text-blue-400 font-semibold px-2 py-1 bg-blue-600/10 rounded-lg">All Chats</span>
        <Link href="/dashboard/chat/archived" className="hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-900 transition">
          <Archive className="w-3.5 h-3.5" />
          <span>Archived</span>
        </Link>
        <Link href="/dashboard/chat/blocked" className="hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-900 transition">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Blocked</span>
        </Link>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {displayedConversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No conversations found.
          </div>
        ) : (
          displayedConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
};
