import React from 'react';
import BaseWidget from '../BaseWidget';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricWidgetProps {
  widgetId: string;
  config: any;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({ widgetId, config }) => {
  const valueKey = config?.visualization?.valueKey || 'value';
  const labelKey = config?.visualization?.labelKey || 'label';
  const trendKey = config?.visualization?.trendKey || 'trend'; // % change

  return (
    <BaseWidget widgetId={widgetId} config={config}>
      {(data) => {
        if (!data) {
          return <div className="flex h-full items-center justify-center text-text-muted text-sm">-</div>;
        }

        // If returned data is an array, take the first row
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return <div className="flex h-full items-center justify-center text-text-muted text-sm">-</div>;

        const value = row[valueKey];
        const label = row[labelKey] || config?.title || '';
        const trend = row[trendKey];

        const getTrendIcon = (t?: number) => {
          if (t === undefined || t === null) return <Minus size={16} className="text-text-muted" />;
          if (t > 0) return <ArrowUpRight size={16} className="text-success" />;
          if (t < 0) return <ArrowDownRight size={16} className="text-error" />;
          return <Minus size={16} className="text-text-muted" />;
        };

        const getTrendColor = (t?: number) => {
          if (t === undefined || t === null) return 'text-text-muted';
          if (t > 0) return 'text-success';
          if (t < 0) return 'text-error';
          return 'text-text-muted';
        };

        return (
          <div className="flex flex-col justify-center h-full p-2">
            <span className="text-sm text-text-muted font-medium mb-1">{label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {trend !== undefined && (
                <div className={`flex items-center text-sm font-medium ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </BaseWidget>
  );
};

export default MetricWidget;
