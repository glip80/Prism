import React from 'react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useLayoutStore } from '../../stores/layoutStore';
import { usePermissions } from '../../hooks/usePermissions';
import WidgetRenderer from './WidgetRenderer';

const ResponsiveGridLayout = WidthProvider(ReactGridLayout);

const GridLayout: React.FC = () => {
  const { currentLayout, updateWidgetLayout } = useLayoutStore();
  const { canEditLayout } = usePermissions();

  if (!currentLayout) return null;

  const handleLayoutChange = (layoutItems: any[]) => {
    updateWidgetLayout(layoutItems);
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layout={currentLayout.widgets.map((w) => ({
        i: w.id,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: w.minW || 1,
        minH: w.minH || 1,
        maxW: w.maxW,
        maxH: w.maxH,
        static: w.static || !canEditLayout,
        isDraggable: (w.isDraggable !== false) && canEditLayout,
        isResizable: (w.isResizable !== false) && canEditLayout,
      }))}
      cols={12}
      rowHeight={currentLayout.layout_config?.rowHeight || 30}
      width={1200}
      margin={currentLayout.layout_config?.margin as [number, number] || [10, 10]}
      containerPadding={currentLayout.layout_config?.containerPadding as [number, number] || [10, 10]}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
    >
      {currentLayout.widgets.map((widget) => (
        <div key={widget.id} className="bg-surface rounded shadow overflow-hidden flex flex-col border border-border">
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default GridLayout;
