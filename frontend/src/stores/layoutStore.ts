import { create } from 'zustand';
import { Layout } from '../types';

interface LayoutState {
  currentLayout: Layout | null;
  layouts: Layout[];
  isLoading: boolean;
  error: string | null;
  setCurrentLayout: (layout: Layout) => void;
  setLayouts: (layouts: Layout[]) => void;
  addLayout: (layout: Layout) => void;
  updateWidgetLayout: (layoutItems: any[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  currentLayout: null,
  layouts: [],
  isLoading: false,
  error: null,

  setCurrentLayout: (layout) => set({ currentLayout: layout }),
  setLayouts: (layouts) => set({ layouts }),
  addLayout: (layout) => set((state) => ({ layouts: [...state.layouts, layout] })),
  
  updateWidgetLayout: (layoutItems) => {
    const { currentLayout } = get();
    if (!currentLayout) return;

    // A simple mapper to update widget x, y, w, h
    const updatedWidgets = currentLayout.widgets.map((widget) => {
      const updatedItem = layoutItems.find((item) => item.i === widget.id);
      if (updatedItem) {
        return {
          ...widget,
          x: updatedItem.x,
          y: updatedItem.y,
          w: updatedItem.w,
          h: updatedItem.h,
        };
      }
      return widget;
    });

    set({
      currentLayout: {
        ...currentLayout,
        widgets: updatedWidgets,
      },
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
