import { apiClient } from './client';
import { Layout } from '../../types';

export const layoutApi = {
  getLayouts: async () => {
    const response = await apiClient.get<Layout[]>('/layouts');
    return response.data;
  },

  getLayoutById: async (id: string, version?: number) => {
    const params = version ? { version } : {};
    const response = await apiClient.get<Layout>(`/layouts/${id}`, { params });
    return response.data;
  },

  createLayout: async (layout: Partial<Layout>) => {
    const response = await apiClient.post<Layout>('/layouts', layout);
    return response.data;
  },

  updateLayout: async (id: string, layout: Partial<Layout>) => {
    const response = await apiClient.put<Layout>(`/layouts/${id}`, layout);
    return response.data;
  },

  deleteLayout: async (id: string) => {
    await apiClient.delete(`/layouts/${id}`);
  },
  
  publishSnapshot: async (id: string) => {
    const response = await apiClient.post<Layout>(`/layouts/${id}/snapshot`);
    return response.data;
  }
};
