import { useState, useCallback, useEffect } from 'react';
import { widgetApi } from '../services/api/widgetApi';
import { socketClient } from '../services/websocket/socketClient';
import { WidgetData } from '../types';

export const useWidgetData = (widgetId: string) => {
  const [data, setData] = useState<WidgetData>({
    id: widgetId,
    data: null,
    loading: false,
    error: null,
    lastUpdated: 0,
  });

  const fetchData = useCallback(async (params = {}) => {
    setData((d) => ({ ...d, loading: true, error: null }));
    try {
      const result = await widgetApi.getWidgetData(widgetId, params);
      setData({
        id: widgetId,
        data: result.data,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      setData((d) => ({
        ...d,
        loading: false,
        error: error.message || 'Failed to fetch widget data',
      }));
    }
  }, [widgetId]);

  useEffect(() => {
    // Subscribe to real-time updates for this widget
    socketClient.subscribeToWidget(widgetId);

    const handleUpdate = (updatePayload: any) => {
      // Assuming payload has shape { widgetId, data }
      if (updatePayload.widgetId === widgetId) {
        setData((d) => ({
          ...d,
          data: updatePayload.data,
          lastUpdated: Date.now(),
        }));
      }
    };

    socketClient.onWidgetDataUpdate(handleUpdate);

    return () => {
      socketClient.unsubscribeFromWidget(widgetId);
      socketClient.offWidgetDataUpdate(handleUpdate);
    };
  }, [widgetId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData,
  };
};
