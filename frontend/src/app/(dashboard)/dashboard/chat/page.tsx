'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, 
  MoreVertical, 
  VolumeX, 
  Archive, 
  ShieldAlert, 
  DollarSign,
  ArrowUpRight,
  History,
  X,
  UserPlus,
  Paperclip,
  Images
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { chatService, ConversationResponse, MessageResponse } from '@/services/chatService';
import { paymentChatService, PaymentMessageResponse, PaymentRequestResponse } from '@/services/paymentChatService';
import { mediaService } from '@/services/mediaService';

import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { OnlineBadge } from '@/components/chat/OnlineBadge';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { LoadingScreen } from '@/components/chat/LoadingScreen';
import { BlockModal } from '@/components/chat/BlockModal';
import { PaymentCard } from '@/components/chat/PaymentCard';
import { PaymentRequestCard } from '@/components/chat/PaymentRequestCard';
import { PaymentTimelineModal } from '@/components/chat/PaymentTimelineModal';

import { DropZone } from '@/components/chat/media/DropZone';
import { UploadDialog, FileUploadItem } from '@/components/chat/media/UploadDialog';

export default function ChatPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    replyingToMessage,
    editingMessage,
    isLoading,
    fetchConversations,
    fetchMessages,
    setActiveConversationId,
    addMessage,
    updateMessage,
    setReplyingToMessage,
    setEditingMessage
  } = useChatStore();

  const { sendTyping } = useWebSocket();

  const [inputContent, setInputContent] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [showRequestMoneyModal, setShowRequestMoneyModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  const [paymentMessagesList, setPaymentMessagesList] = useState<PaymentMessageResponse[]>([]);
  const [paymentRequestsList, setPaymentRequestsList] = useState<PaymentRequestResponse[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadPaymentData = async () => {
    if (activeConversationId) {
      try {
        const timeline = await paymentChatService.getTimeline(activeConversationId);
        setPaymentMessagesList(timeline.paymentMessages);
        setPaymentRequestsList(timeline.paymentRequests);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      loadPaymentData();
    }
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, paymentMessagesList, paymentRequestsList, activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== user?.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConversationId) return;

    const contentToSend = inputContent;
    setInputContent('');

    try {
      if (editingMessage) {
        const edited = await chatService.editMessage(editingMessage.id, contentToSend);
        updateMessage(edited);
        setEditingMessage(null);
      } else {
        const newMsg = await chatService.sendMessage({
          conversationId: activeConversationId,
          content: contentToSend,
          replyToId: replyingToMessage?.id
        });
        addMessage(newMsg);
        setReplyingToMessage(null);
      }
      sendTyping(activeConversationId, false);
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const items: FileUploadItem[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'PENDING'
    }));
    setUploadItems(items);
    setShowUploadModal(true);
  };

  const handleExecuteUpload = async () => {
    if (!activeConversationId || uploadItems.length === 0) return;
    setIsUploadingFiles(true);

    try {
      const filesToUpload = uploadItems.map((item) => item.file);
      const responses = await mediaService.uploadMultiple(filesToUpload, activeConversationId);

      // Create a chat message referencing uploaded media
      const fileNames = responses.map((r) => r.originalName).join(', ');
      const newMsg = await chatService.sendMessage({
        conversationId: activeConversationId,
        content: `Shared files: ${fileNames}`
      });
      newMsg.attachments = responses;
      addMessage(newMsg);

      setShowUploadModal(false);
      setUploadItems([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSendMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !otherParticipant || !paymentAmount) return;

    try {
      await paymentChatService.sendMoney({
        conversationId: activeConversationId,
        receiverId: otherParticipant.userId,
        amount: parseFloat(paymentAmount),
        note: paymentNote
      });
      setShowSendMoneyModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      loadPaymentData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send money');
    }
  };

  const handleRequestMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !otherParticipant || !requestAmount) return;

    try {
      await paymentChatService.requestMoney({
        conversationId: activeConversationId,
        receiverId: otherParticipant.userId,
        amount: parseFloat(requestAmount),
        reason: requestReason
      });
      setShowRequestMoneyModal(false);
      setRequestAmount('');
      setRequestReason('');
      loadPaymentData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request money');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (activeConversationId) {
      sendTyping(activeConversationId, e.target.value.length > 0);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (query.trim().length > 1) {
      try {
        const res = await chatService.searchUsers(query);
        setUserSearchResults(res.users);
      } catch (err) {
        console.error('User search failed', err);
      }
    } else {
      setUserSearchResults([]);
    }
  };

  const handleStartChatWithUser = async (targetUserId: string) => {
    try {
      const newConv = await chatService.createConversation({
        type: 'PRIVATE',
        participantUserIds: [targetUserId]
      });
      setShowUserSearchModal(false);
      await fetchConversations();
      setActiveConversationId(newConv.id);
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const handleBlockUserConfirm = async (reason: string) => {
    if (!otherParticipant) return;
    try {
      await chatService.blockUser(otherParticipant.userId, reason);
      setShowBlockModal(false);
      fetchConversations();
    } catch (err) {
      console.error('Block failed', err);
    }
  };

  if (isLoading && conversations.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Left Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={() => setShowUserSearchModal(true)}
      />

      {/* Main Conversation Area with DropZone */}
      <DropZone onFilesDropped={handleFilesSelected}>
        <div className="flex-1 flex flex-col h-full bg-slate-900/40 relative">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                      {activeConversation.avatarUrl ? (
                        <img src={activeConversation.avatarUrl} alt={activeConversation.title} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        activeConversation.title.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <OnlineBadge online={otherParticipant?.online || false} className="absolute bottom-0 right-0" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-100">{activeConversation.title}</h3>
                    <p className="text-xs text-slate-400">
                      {otherParticipant?.online ? (
                        <span className="text-emerald-400 font-medium">Online</span>
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center space-x-2 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowSendMoneyModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
                    title="Send Money"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestMoneyModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
                    title="Request Money"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Request</span>
                  </button>
                  <Link
                    href={`/dashboard/chat/media?conversationId=${activeConversationId}`}
                    className="p-2 hover:bg-slate-800 hover:text-white rounded-xl transition"
                    title="Shared Media Gallery"
                  >
                    <Images className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowTimelineModal(true)}
                    className="p-2 hover:bg-slate-800 hover:text-white rounded-xl transition"
                    title="Payment History Timeline"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBlockModal(true)}
                    className="p-2 hover:bg-slate-800 hover:text-rose-400 rounded-xl transition"
                    title="Block User"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages & Media & Payment Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {currentMessages.length === 0 && paymentMessagesList.length === 0 && paymentRequestsList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No messages, payments, or media files yet. Drop files or say hi!
                  </div>
                ) : (
                  <>
                    {/* Payment Requests Cards */}
                    {paymentRequestsList.map((pr) => (
                      <PaymentRequestCard
                        key={pr.id}
                        request={pr}
                        currentUserId={user?.id || ''}
                        onStatusUpdate={loadPaymentData}
                      />
                    ))}

                    {/* Payment Sent/Received Cards */}
                    {paymentMessagesList.map((pm) => (
                      <PaymentCard
                        key={pm.id}
                        payment={pm}
                        isMe={pm.senderId === user?.id}
                      />
                    ))}

                    {/* Text & Media Messages */}
                    {currentMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={msg.senderId === user?.id}
                        onReply={(m) => setReplyingToMessage(m)}
                        onEdit={(m) => {
                          setEditingMessage(m);
                          setInputContent(m.content);
                        }}
                        onDeleteForMe={(msgId) => chatService.deleteMessageForMe(msgId)}
                        onDeleteForEveryone={(msgId) => chatService.deleteMessageForEveryone(msgId)}
                        onAddReaction={(msgId, emoji) => chatService.addReaction(msgId, emoji)}
                        onPin={(msgId, pin) => chatService.pinMessage(msgId, pin)}
                        onStar={(msgId, star) => chatService.starMessage(msgId, star)}
                      />
                    ))}
                  </>
                )}

                {/* Typing indicator */}
                {otherParticipant && typingUsers[`${activeConversation.id}:${otherParticipant.userId}`] && (
                  <TypingIndicator userName={otherParticipant.fullName} />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
                {replyingToMessage && (
                  <ReplyPreview
                    message={replyingToMessage}
                    onCancel={() => setReplyingToMessage(null)}
                  />
                )}

                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesSelected(Array.from(e.target.files));
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700/60 transition shrink-0"
                    title="Attach File or Media"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputContent}
                    onChange={handleInputChange}
                    placeholder={editingMessage ? 'Editing message...' : 'Type a message or drag files here...'}
                    className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-2xl px-5 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={!inputContent.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl shadow-lg shadow-blue-600/30 transition duration-150 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </DropZone>

      {/* Upload Dialog */}
      {showUploadModal && (
        <UploadDialog
          items={uploadItems}
          isUploading={isUploadingFiles}
          onClose={() => setShowUploadModal(false)}
          onUploadAll={handleExecuteUpload}
        />
      )}

      {/* Send Money Modal */}
      {showSendMoneyModal && otherParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowSendMoneyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-1">Pay {otherParticipant.fullName}</h3>
            <p className="text-xs text-slate-400 mb-4">Instant payment via ApexPay Wallet</p>

            <form onSubmit={handleSendMoneySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="What's this payment for?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition"
              >
                Send ${paymentAmount || '0.00'} Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Money Modal */}
      {showRequestMoneyModal && otherParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowRequestMoneyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-1">Request Money from {otherParticipant.fullName}</h3>
            <p className="text-xs text-slate-400 mb-4">Recipient will receive a payment request card in chat</p>

            <form onSubmit={handleRequestMoneySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Dinner bill, coffee, split expenses..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/30 transition"
              >
                Request ${requestAmount || '0.00'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Timeline Modal */}
      {showTimelineModal && activeConversationId && (
        <PaymentTimelineModal
          conversationId={activeConversationId}
          onClose={() => setShowTimelineModal(false)}
        />
      )}

      {/* Block User Modal */}
      {showBlockModal && otherParticipant && (
        <BlockModal
          userName={otherParticipant.fullName}
          onConfirm={handleBlockUserConfirm}
          onClose={() => setShowBlockModal(false)}
        />
      )}

      {/* Start New Chat Modal */}
      {showUserSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowUserSearchModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-blue-400 mb-4">
              <UserPlus className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">Start New Chat</h3>
            </div>

            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Search user by name, username, or phone..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 mb-4 focus:outline-none focus:border-blue-500"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {userSearchResults.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">Search users on ApexPay to connect</p>
              ) : (
                userSearchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartChatWithUser(u.id)}
                    className="flex items-center space-x-3 p-3 bg-slate-800/60 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700/50 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                      {u.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{u.fullName}</h4>
                      <p className="text-xs text-slate-400">@{u.username} • {u.mobileNumber}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
