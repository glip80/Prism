import React from 'react';
import BaseWidget from '../BaseWidget';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface ChartWidgetProps {
  widgetId: string;
  config: any;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ widgetId, config }) => {
  const chartType = config?.visualization?.type || 'line';
  const xAxisKey = config?.visualization?.xAxisKey || 'name';
  const series = config?.visualization?.series || [];

  const renderChart = (data: any[]) => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey={xAxisKey} stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
            <Legend />
            {series.map((s: any) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color || `var(--color-primary)`} />
            ))}
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey={xAxisKey} stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
            <Legend />
            {series.map((s: any) => (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color || `var(--color-primary)`} fill={s.color || `var(--color-primary)`} fillOpacity={0.3} />
            ))}
          </AreaChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey={xAxisKey} stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
            <Legend />
            {series.map((s: any) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color || `var(--color-primary)`} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <BaseWidget widgetId={widgetId} config={config}>
      {(data) => {
        if (!data || !Array.isArray(data)) {
          return <div className="flex h-full items-center justify-center text-text-muted text-sm">No data available</div>;
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(data)}
          </ResponsiveContainer>
        );
      }}
    </BaseWidget>
  );
};

export default ChartWidget;
