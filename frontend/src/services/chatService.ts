import api from './api';

export interface ParticipantDTO {
  userId: string;
  fullName: string;
  username: string;
  profilePhoto?: string;
  role: string;
  online: boolean;
  lastSeen?: string;
}

export interface ConversationResponse {
  id: string;
  type: 'PRIVATE' | 'MERCHANT' | 'CUSTOMER_SUPPORT' | 'GROUP';
  title: string;
  avatarUrl?: string;
  lastMessageContent?: string;
  lastMessageTime?: string;
  muted: boolean;
  archived: boolean;
  pinned: boolean;
  unreadCount: number;
  participants: ParticipantDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ReactionDTO {
  id: string;
  userId: string;
  userName: string;
  reaction: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  messageType: 'TEXT' | 'SYSTEM';
  content: string;
  replyToId?: string;
  replyToContent?: string;
  edited: boolean;
  deletedForEveryone: boolean;
  pinned: boolean;
  starred: boolean;
  delivered: boolean;
  seen: boolean;
  reactions: ReactionDTO[];
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  conversations: ConversationResponse[];
  messages: MessageResponse[];
  users: Array<{
    id: string;
    fullName: string;
    username: string;
    profilePhoto?: string;
    mobileNumber: string;
  }>;
}

export interface BlockedUserDTO {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserPhoto?: string;
  reason?: string;
  createdAt: string;
}

export const chatService = {
  getConversations: async (): Promise<ConversationResponse[]> => {
    const res = await api.get('/api/chat/conversations');
    return res.data.data;
  },

  getArchivedConversations: async (): Promise<ConversationResponse[]> => {
    const res = await api.get('/api/chat/conversations/archived');
    return res.data.data;
  },

  getConversationById: async (id: string): Promise<ConversationResponse> => {
    const res = await api.get(`/api/chat/conversations/${id}`);
    return res.data.data;
  },

  createConversation: async (data: { type: string; title?: string; participantUserIds: string[] }): Promise<ConversationResponse> => {
    const res = await api.post('/api/chat/conversations', data);
    return res.data.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/api/chat/conversations/${id}`);
  },

  archiveConversation: async (id: string, archive: boolean): Promise<ConversationResponse> => {
    const res = await api.put(`/api/chat/conversations/${id}/archive?archive=${archive}`);
    return res.data.data;
  },

  muteConversation: async (id: string, mute: boolean): Promise<ConversationResponse> => {
    const res = await api.put(`/api/chat/conversations/${id}/mute?mute=${mute}`);
    return res.data.data;
  },

  pinConversation: async (id: string, pin: boolean): Promise<ConversationResponse> => {
    const res = await api.put(`/api/chat/conversations/${id}/pin?pin=${pin}`);
    return res.data.data;
  },

  getMessages: async (conversationId: string, page = 0, size = 50): Promise<MessageResponse[]> => {
    const res = await api.get(`/api/chat/messages/${conversationId}?page=${page}&size=${size}`);
    return res.data.data.content || [];
  },

  sendMessage: async (data: { conversationId: string; content: string; messageType?: string; replyToId?: string }): Promise<MessageResponse> => {
    const res = await api.post('/api/chat/messages', data);
    return res.data.data;
  },

  editMessage: async (messageId: string, content: string): Promise<MessageResponse> => {
    const res = await api.put(`/api/chat/messages/${messageId}`, { content });
    return res.data.data;
  },

  deleteMessageForMe: async (messageId: string): Promise<void> => {
    await api.delete(`/api/chat/messages/${messageId}/for-me`);
  },

  deleteMessageForEveryone: async (messageId: string): Promise<MessageResponse> => {
    const res = await api.delete(`/api/chat/messages/${messageId}`);
    return res.data.data;
  },

  addReaction: async (messageId: string, reaction: string): Promise<MessageResponse> => {
    const res = await api.post(`/api/chat/messages/${messageId}/reactions`, { reaction });
    return res.data.data;
  },

  pinMessage: async (messageId: string, pin = true): Promise<MessageResponse> => {
    const res = await api.put(`/api/chat/messages/${messageId}/pin?pin=${pin}`);
    return res.data.data;
  },

  starMessage: async (messageId: string, star = true): Promise<MessageResponse> => {
    const res = await api.put(`/api/chat/messages/${messageId}/star?star=${star}`);
    return res.data.data;
  },

  forwardMessage: async (messageId: string, targetConversationId: string): Promise<MessageResponse> => {
    const res = await api.post(`/api/chat/messages/${messageId}/forward?targetConversationId=${targetConversationId}`);
    return res.data.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/api/chat/messages/read/${conversationId}`);
  },

  searchAll: async (query: string): Promise<SearchResponse> => {
    const res = await api.get(`/api/chat/search?q=${encodeURIComponent(query)}`);
    return res.data.data;
  },

  searchUsers: async (query: string): Promise<SearchResponse> => {
    const res = await api.get(`/api/chat/search/users?q=${encodeURIComponent(query)}`);
    return res.data.data;
  },

  blockUser: async (blockedUserId: string, reason?: string): Promise<BlockedUserDTO> => {
    const res = await api.post('/api/chat/block', { blockedUserId, reason });
    return res.data.data;
  },

  unblockUser: async (blockedUserId: string): Promise<void> => {
    await api.delete(`/api/chat/block/${blockedUserId}`);
  },

  getBlockedUsers: async (): Promise<BlockedUserDTO[]> => {
    const res = await api.get('/api/chat/block');
    return res.data.data;
  }
};
