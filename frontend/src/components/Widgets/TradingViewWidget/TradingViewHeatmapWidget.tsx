import React, { useEffect, useRef, memo } from 'react';
import { useThemeStore } from '../../../stores/themeStore';

interface TradingViewHeatmapWidgetProps {
  widgetId: string;
  config: any;
}

const TradingViewHeatmapWidget: React.FC<TradingViewHeatmapWidgetProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme: appTheme } = useThemeStore();

  const dataSource = config?.visualization?.dataSource || 'SPX500';
  const blockSize = config?.visualization?.blockSize || 'market_cap_basic';
  const blockColor = config?.visualization?.blockColor || 'change';
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
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    widgetContainer.appendChild(innerDiv);

    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource,
      grouping: 'sector',
      blockSize,
      blockColor,
      locale: 'en',
      symbolUrl: '',
      colorTheme: theme,
      hasTopBar: true,
      isDataSet498: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: '100%',
      height: '100%',
    });

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [dataSource, blockSize, blockColor, theme]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default memo(TradingViewHeatmapWidget);
