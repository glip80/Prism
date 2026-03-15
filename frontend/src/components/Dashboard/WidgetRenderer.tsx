import React from 'react';
import { Settings, GripHorizontal } from 'lucide-react';
import ChartWidget from '../Widgets/ChartWidget/ChartWidget';
import TableWidget from '../Widgets/TableWidget/TableWidget';
import MetricWidget from '../Widgets/MetricWidget/MetricWidget';
import TradingViewChartWidget from '../Widgets/TradingViewWidget/TradingViewChartWidget';
import TradingViewScreenerWidget from '../Widgets/TradingViewWidget/TradingViewScreenerWidget';
import TradingViewHeatmapWidget from '../Widgets/TradingViewWidget/TradingViewHeatmapWidget';

interface Props {
  widget: any; // Ideally typed as Widget
}

const WidgetRenderer: React.FC<Props> = ({ widget }) => {
  const renderContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widgetId={widget.id} config={widget.config} />;
      case 'table':
        return <TableWidget widgetId={widget.id} config={widget.config} />;
      case 'metric':
        return <MetricWidget widgetId={widget.id} config={widget.config} />;
      case 'tradingview-chart':
        return <TradingViewChartWidget widgetId={widget.id} config={widget.config} />;
      case 'tradingview-screener':
        return <TradingViewScreenerWidget widgetId={widget.id} config={widget.config} />;
      case 'tradingview-heatmap':
        return <TradingViewHeatmapWidget widgetId={widget.id} config={widget.config} />;
      default:
        return <div className="p-4 text-text-muted">Unsupported widget type: {widget.type}</div>;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
        <h3 className="font-semibold text-sm truncate text-text">{widget.title}</h3>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-border rounded text-text-muted transition-colors">
            <Settings size={14} />
          </button>
          <div className="widget-drag-handle cursor-move p-1 hover:bg-border rounded text-text-muted transition-colors">
            <GripHorizontal size={14} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto relative">
        {renderContent()}
      </div>
    </>
  );
};

export default WidgetRenderer;

