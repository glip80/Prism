import React, { useEffect } from 'react';
import { useLayoutStore } from '../../stores/layoutStore';
import { useLayout } from '../../hooks/useLayout';
import GridLayout from './GridLayout';
import ThemeSwitcher from './Toolbar/ThemeSwitcher';
import LayoutSelector from './Toolbar/LayoutSelector';
import AddWidgetButton from './Toolbar/AddWidgetButton';

const DashboardContainer: React.FC = () => {
  const { currentLayout, isLoading, error } = useLayoutStore();
  const { loadLayouts } = useLayout();

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  if (isLoading && !currentLayout) {
    return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-error">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-2 mb-4 bg-surface rounded shadow border border-border">
        <div className="flex items-center gap-4">
          <LayoutSelector />
          <h2 className="text-lg font-semiboldtext-text">
            {currentLayout?.title || 'No Layout Selected'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AddWidgetButton />
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background rounded relative">
        {currentLayout ? (
          <GridLayout />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            Please select a layout
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContainer;
