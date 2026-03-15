import React, { useEffect } from 'react';
import { useLayoutStore } from '../../stores/layoutStore';
import { useLayout } from '../../hooks/useLayout';
import GridLayout from './GridLayout';
import { Home, ChevronRight } from 'lucide-react';

const DashboardContainer: React.FC = () => {
  const { currentLayout, isLoading, error } = useLayoutStore();
  const { loadLayouts } = useLayout();

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  if (isLoading && !currentLayout) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <div className="breadcrumb-left">
          <h1 className="dashboard-title">
            {currentLayout?.title || 'Dashboard'}
          </h1>
          <div className="breadcrumb-path">
            <Home size={14} />
            <ChevronRight size={12} />
            <span>Dashboards</span>
            <ChevronRight size={12} />
            <span className="breadcrumb-current">{currentLayout?.title || 'Select Layout'}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="dashboard-grid-area">
        {currentLayout ? (
          <GridLayout />
        ) : (
          <div className="dashboard-empty">
            Please select a layout from the sidebar
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContainer;
