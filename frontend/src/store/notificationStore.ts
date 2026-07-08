import { create } from 'zustand';
import { notificationService, NotificationItem } from '@/services/notificationService';
import { MinimalStompClient } from '@/utils/stompClient';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  activeToast: NotificationItem | null;
  client: MinimalStompClient | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  connectWebSocket: (username: string) => void;
  disconnectWebSocket: () => void;
  clearToast: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  activeToast: null,
  client: null,

  fetchNotifications: async () => {
    try {
      const data = await notificationService.getNotifications();
      const unread = data.filter((n) => !n.read).length;
      set({ notifications: data, unreadCount: unread });
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const unread = updated.filter((n) => !n.read).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, read: true }));
        return { notifications: updated, unreadCount: 0 };
      });
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationService.deleteNotification(id);
      set((state) => {
        const updated = state.notifications.filter((n) => n.id !== id);
        const unread = updated.filter((n) => !n.read).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  },

  connectWebSocket: (username) => {
    const existingClient = get().client;
    if (existingClient) {
      console.log('WebSocket client already instantiated.');
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const stompClient = new MinimalStompClient(apiBaseUrl);

    stompClient.connect(
      () => {
        console.log('Notification client connected to WebSocket.');
        set({ isConnected: true, client: stompClient });

        // Subscribe to User's Private Notification Queue
        stompClient.subscribe(`/user/queue/notifications`, (headers, body) => {
          try {
            const liveNotification: NotificationItem = JSON.parse(body);
            console.log('Received live notification frame:', liveNotification);

            // Append to list and play toast
            set((state) => {
              const list = [liveNotification, ...state.notifications];
              const unread = list.filter((n) => !n.read).length;
              return {
                notifications: list,
                unreadCount: unread,
                activeToast: liveNotification,
              };
            });

            // Trigger Browser Native Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(liveNotification.title, {
                body: liveNotification.message,
                icon: '/favicon.ico',
              });
            }
          } catch (err) {
            console.error('Error parsing live notification STOMP frame:', err);
          }
        });
      },
      (err) => {
        console.error('WebSocket connection error:', err);
        set({ isConnected: false });
      }
    );
  },

  disconnectWebSocket: () => {
    const stompClient = get().client;
    if (stompClient) {
      stompClient.disconnect();
      set({ client: null, isConnected: false });
    }
  },

  clearToast: () => set({ activeToast: null }),
}));
