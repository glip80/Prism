import { apiClient } from './client';
import { User } from '../../types';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post<{ access_token: string; user: User }>('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  checkPermission: async (permission: string) => {
    const response = await apiClient.post<{ has_permission: boolean }>('/auth/check-permission', { permission });
    return response.data.has_permission;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }
};
