import api from '../services/api';

export interface UploadResponse {
  mediaFileId: string;
  attachmentId?: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  thumbnailUrl?: string;
}

export interface MediaResponse {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  size: number;
  checksum: string;
  fileUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
}

export interface AttachmentResponse {
  attachmentId: string;
  messageId: string;
  uploaderId: string;
  uploaderName: string;
  attachmentType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'SPREADSHEET' | 'PRESENTATION' | 'ARCHIVE';
  mediaFile: MediaResponse;
  createdAt: string;
}

export const mediaService = {
  uploadSingle: async (file: File, conversationId?: string, messageId?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) formData.append('conversationId', conversationId);
    if (messageId) formData.append('messageId', messageId);

    const res = await api.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  uploadMultiple: async (files: File[], conversationId?: string, messageId?: string): Promise<UploadResponse[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (conversationId) formData.append('conversationId', conversationId);
    if (messageId) formData.append('messageId', messageId);

    const res = await api.post('/api/media/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  getMediaById: async (id: string): Promise<MediaResponse> => {
    const res = await api.get(`/api/media/${id}`);
    return res.data.data;
  },

  searchMedia: async (query: string): Promise<MediaResponse[]> => {
    const res = await api.get(`/api/media/search?query=${encodeURIComponent(query)}`);
    return res.data.data.files;
  },

  getConversationMedia: async (conversationId: string): Promise<AttachmentResponse[]> => {
    const res = await api.get(`/api/media/conversation/${conversationId}`);
    return res.data.data;
  },

  deleteMedia: async (id: string): Promise<void> => {
    await api.delete(`/api/media/${id}`);
  }
};
