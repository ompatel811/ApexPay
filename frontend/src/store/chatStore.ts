import { create } from 'zustand';
import { ConversationResponse, MessageResponse, chatService } from '@/services/chatService';

interface ChatStore {
  conversations: ConversationResponse[];
  activeConversationId: string | null;
  messages: Record<string, MessageResponse[]>;
  typingUsers: Record<string, boolean>; // conversationId:userId -> isTyping
  replyingToMessage: MessageResponse | null;
  editingMessage: MessageResponse | null;
  isLoading: boolean;
  error: string | null;

  setConversations: (conversations: ConversationResponse[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  updateMessage: (message: MessageResponse) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setReplyingToMessage: (msg: MessageResponse | null) => void;
  setEditingMessage: (msg: MessageResponse | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  replyingToMessage: null,
  editingMessage: null,
  isLoading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, newMessages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: newMessages
    }
  })),

  addMessage: (msg) => set((state) => {
    const list = state.messages[msg.conversationId] || [];
    const exists = list.some((m) => m.id === msg.id);
    if (exists) return state;

    return {
      messages: {
        ...state.messages,
        [msg.conversationId]: [...list, msg]
      }
    };
  }),

  updateMessage: (msg) => set((state) => {
    const list = state.messages[msg.conversationId] || [];
    const updated = list.map((m) => (m.id === msg.id ? msg : m));
    return {
      messages: {
        ...state.messages,
        [msg.conversationId]: updated
      }
    };
  }),

  setTyping: (conversationId, userId, isTyping) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [`${conversationId}:${userId}`]: isTyping
    }
  })),

  setReplyingToMessage: (msg) => set({ replyingToMessage: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await chatService.getConversations();
      set({ conversations: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch conversations', isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      const msgs = await chatService.getMessages(conversationId);
      get().setMessages(conversationId, msgs);
    } catch (err: any) {
      console.error('Failed to fetch messages', err);
    }
  }
}));
