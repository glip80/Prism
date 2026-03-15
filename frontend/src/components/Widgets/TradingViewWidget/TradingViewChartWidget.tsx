import React, { useEffect, useRef, memo } from 'react';
import { useThemeStore } from '../../../stores/themeStore';

interface TradingViewChartWidgetProps {
  widgetId: string;
  config: any;
}

const TradingViewChartWidget: React.FC<TradingViewChartWidgetProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { theme: appTheme } = useThemeStore();

  const symbol = config?.visualization?.symbol || 'NASDAQ:AAPL';
  const interval = config?.visualization?.interval || 'D';
  const studies = config?.visualization?.studies || ['STD;RSI'];
  const theme = appTheme.id.includes('dark') ? 'dark' : 'light';

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    widgetContainer.appendChild(innerDiv);

    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      studies,
      support_host: 'https://www.tradingview.com',
    });

    widgetContainer.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, JSON.stringify(studies)]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default memo(TradingViewChartWidget);
