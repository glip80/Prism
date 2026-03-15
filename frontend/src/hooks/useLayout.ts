import { useCallback } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import { layoutApi } from '../services/api/layoutApi';
import { Layout } from '../types';

const STOCK_FINANCE_LAYOUT: Layout = {
  id: 'stock-finance-default',
  title: 'Stock Finance',
  description: 'Financial dashboard with TradingView widgets',
  organization_id: '00000000-0000-0000-0000-000000000000',
  created_by: '00000000-0000-0000-0000-000000000000',
  layout_config: {
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4 },
    rowHeight: 30,
    margin: [10, 10] as [number, number],
    containerPadding: [10, 10] as [number, number],
  },
  widgets: [
    {
      id: 'tv-chart-1',
      type: 'tradingview-chart',
      title: 'Advanced Chart',
      x: 0,
      y: 0,
      w: 8,
      h: 14,
      minW: 4,
      minH: 8,
      static: false,
      isDraggable: true,
      isResizable: true,
      config: {
        dataSource: {
          connector_id: '00000000-0000-0000-0000-000000000000',
          query: '',
          parameters: [],
          cacheDuration: 0,
          timeout: 30000,
        },
        visualization: {
          symbol: 'NASDAQ:AAPL',
          interval: 'D',
          studies: ['STD;RSI'],
        },
      },
    },
    {
      id: 'tv-screener-1',
      type: 'tradingview-screener',
      title: 'Stock Screener',
      x: 8,
      y: 0,
      w: 4,
      h: 14,
      minW: 3,
      minH: 8,
      static: false,
      isDraggable: true,
      isResizable: true,
      config: {
        dataSource: {
          connector_id: '00000000-0000-0000-0000-000000000000',
          query: '',
          parameters: [],
          cacheDuration: 0,
          timeout: 30000,
        },
        visualization: {
          defaultScreen: 'most_capitalized',
        },
      },
    },
    {
      id: 'tv-heatmap-1',
      type: 'tradingview-heatmap',
      title: 'S&P 500 Heatmap',
      x: 0,
      y: 14,
      w: 12,
      h: 14,
      minW: 6,
      minH: 8,
      static: false,
      isDraggable: true,
      isResizable: true,
      config: {
        dataSource: {
          connector_id: '00000000-0000-0000-0000-000000000000',
          query: '',
          parameters: [],
          cacheDuration: 0,
          timeout: 30000,
        },
        visualization: {
          dataSource: 'SPX500',
          blockSize: 'market_cap_basic',
          blockColor: 'change',
        },
      },
    },
  ],
  theme: {
    id: 'default',
    primaryColor: '#3B82F6',
    backgroundColor: '#0F172A',
    textColor: '#E2E8F0',
  },
  tags: ['finance', 'stocks'],
  is_public: true,
  shared_with: [],
  version: 1,
};

export const useLayout = () => {
  const store = useLayoutStore();

  const loadLayouts = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await layoutApi.getLayouts();
      const layouts = Array.isArray(data) ? data : [];

      // Always include the built-in Stock Finance layout
      const hasFinanceLayout = layouts.some((l: Layout) => l.id === STOCK_FINANCE_LAYOUT.id);
      if (!hasFinanceLayout) {
        layouts.push(STOCK_FINANCE_LAYOUT);
      }

      store.setLayouts(layouts);

      // Auto-select finance layout if nothing is currently selected
      if (!store.currentLayout && layouts.length > 0) {
        const financeLayout = layouts.find((l: Layout) => l.id === STOCK_FINANCE_LAYOUT.id);
        store.setCurrentLayout(financeLayout || layouts[0]);
      }
    } catch (error: any) {
      // On API failure, still provide the built-in layout
      store.setLayouts([STOCK_FINANCE_LAYOUT]);
      if (!store.currentLayout) {
        store.setCurrentLayout(STOCK_FINANCE_LAYOUT);
      }
      store.setError(null); // Don't show error if we loaded fallback
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadLayoutById = useCallback(async (id: string, version?: number) => {
    // Handle built-in layout
    if (id === STOCK_FINANCE_LAYOUT.id) {
      store.setCurrentLayout(STOCK_FINANCE_LAYOUT);
      return;
    }

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
    // Don't try to save built-in layouts to API
    if (store.currentLayout.id === STOCK_FINANCE_LAYOUT.id) return;
    
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
