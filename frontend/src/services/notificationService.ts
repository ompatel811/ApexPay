import { api } from './api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/api/notifications');
    return response.data.data;
  },

  getUnreadNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/api/notifications/unread');
    return response.data.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/api/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/api/notifications/${id}`);
  },
};
