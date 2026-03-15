import { apiClient } from './client';

export const widgetApi = {
  getWidgetData: async (widgetId: string, params: any = {}) => {
    const response = await apiClient.post(`/widgets/${widgetId}/query`, params);
    return response.data;
  },

  refreshWidget: async (widgetId: string) => {
    const response = await apiClient.post(`/widgets/${widgetId}/refresh`);
    return response.data;
  },

  getAvailableConnectors: async () => {
    const response = await apiClient.get('/connectors');
    return response.data;
  },

  testQuery: async (connectorId: string, query: string, params: any[]) => {
    const response = await apiClient.post(`/connectors/${connectorId}/test`, { query, params });
    return response.data;
  }
};
