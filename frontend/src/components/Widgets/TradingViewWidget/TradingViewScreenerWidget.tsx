import React, { useEffect, useRef, memo } from 'react';
import { useThemeStore } from '../../../stores/themeStore';

interface TradingViewScreenerWidgetProps {
  widgetId: string;
  config: any;
}

const TradingViewScreenerWidget: React.FC<TradingViewScreenerWidgetProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme: appTheme } = useThemeStore();

  const defaultSymbols = config?.visualization?.symbols || [
    { s: 'NASDAQ:AAPL', d: 'Apple Inc.' },
    { s: 'NASDAQ:GOOGL', d: 'Alphabet Inc.' },
    { s: 'NASDAQ:MSFT', d: 'Microsoft Corp.' },
    { s: 'NASDAQ:AMZN', d: 'Amazon.com Inc.' },
    { s: 'NASDAQ:TSLA', d: 'Tesla Inc.' },
    { s: 'NASDAQ:META', d: 'Meta Platforms' },
    { s: 'NASDAQ:NVDA', d: 'NVIDIA Corp.' },
    { s: 'NYSE:JPM', d: 'JPMorgan Chase' },
  ];

  const theme = appTheme.id.includes('dark') ? 'dark' : 'light';

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(innerDiv);

    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      defaultColumn: 'overview',
      defaultScreen: 'most_capitalized',
      showToolbar: true,
      locale: 'en',
      market: 'america',
      colorTheme: theme,
    });

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme, JSON.stringify(defaultSymbols)]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default memo(TradingViewScreenerWidget);
