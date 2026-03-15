import { useCallback } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import { layoutApi } from '../services/api/layoutApi';

export const useLayout = () => {
  const store = useLayoutStore();

  const loadLayouts = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await layoutApi.getLayouts();
      store.setLayouts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      store.setError(error.message || 'Failed to load layouts');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadLayoutById = useCallback(async (id: string, version?: number) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const layout = await layoutApi.getLayoutById(id, version);
      store.setCurrentLayout(layout);
    } catch (error: any) {
      store.setError(error.message || 'Failed to load layout details');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const saveCurrentLayout = useCallback(async () => {
    if (!store.currentLayout || !store.currentLayout.id) return;
    
    store.setLoading(true);
    store.setError(null);
    try {
      const updated = await layoutApi.updateLayout(store.currentLayout.id, store.currentLayout);
      store.setCurrentLayout(updated);
    } catch (error: any) {
      store.setError(error.message || 'Failed to save layout');
    } finally {
      store.setLoading(false);
    }
  }, [store.currentLayout]);

  return {
    ...store,
    loadLayouts,
    loadLayoutById,
    saveCurrentLayout,
  };
};
