import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore, UserProfile } from '@/store/authStore';
import { useRouter } from 'next/navigation';

// Interfaces for API payloads
export interface LoginPayload {
  identifier: string;
  password?: string;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  dateOfBirth?: string;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  lastLogin: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  entityName: string;
  entityId: string;
  timestamp: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth, clearAuth, updateUser } = useAuthStore();

  // 1. Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await api.post('/api/auth/login', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const { accessToken, refreshToken, user } = data.data;
        setAuth(user, accessToken, refreshToken);
        router.push('/dashboard');
      }
    },
  });

  // 2. Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await api.post('/api/auth/register', payload);
      return response.data;
    },
    onSuccess: () => {
      router.push('/login');
    },
  });

  // 3. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });

  // 4. Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await api.put('/api/users/profile', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser(data.data);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });

  // 5. Upload Profile Photo Mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser({ profilePhoto: data.data.profilePhoto });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });

  // 6. Remove Profile Photo Mutation
  const removePhotoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/api/users/profile/photo');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser({ profilePhoto: null });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });

  // 7. Revoke Device Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.delete(`/api/users/sessions/${sessionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    
    uploadPhoto: uploadPhotoMutation.mutate,
    isUploadingPhoto: uploadPhotoMutation.isPending,
    uploadPhotoError: uploadPhotoMutation.error,
    
    removePhoto: removePhotoMutation.mutate,
    isRemovingPhoto: removePhotoMutation.isPending,
    
    revokeSession: revokeSessionMutation.mutate,
    isRevokingSession: revokeSessionMutation.isPending,
  };
}

// 8. Fetch Profile Query
export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await api.get('/api/users/me');
      return response.data.data;
    },
    retry: 1,
  });
}

// 9. Fetch Sessions Query
export function useSessionsQuery() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async (): Promise<DeviceSession[]> => {
      const response = await api.get('/api/users/sessions');
      return response.data.data;
    },
    refetchInterval: 10000, // refresh session list every 10s
  });
}

// 10. Fetch Activity Timeline Query
export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async (): Promise<AuditLog[]> => {
      const response = await api.get('/api/users/activity');
      return response.data.data;
    },
  });
}
