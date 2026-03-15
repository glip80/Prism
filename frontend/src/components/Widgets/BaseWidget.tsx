import React, { ReactNode } from 'react';
import { useWidgetData } from '../../hooks/useWidgetData';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  widgetId: string;
  config: any;
  children: (data: any, isLoading: boolean) => ReactNode;
}

const BaseWidget: React.FC<Props> = ({ widgetId, children }) => {
  const { data, loading, error, refetch, lastUpdated } = useWidgetData(widgetId);

  return (
    <div className="w-full h-full relative flex flex-col">
      {error && (
        <div className="absolute inset-0 z-10 bg-surface/80 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="text-error mb-2" size={24} />
          <p className="text-sm text-error">{error}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}
      
      {loading && !data && (
        <div className="absolute inset-0 z-10 bg-surface/50 flex items-center justify-center">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      )}

      <div className="flex-1 w-full h-full p-2 overflow-hidden">
        {children(data, loading)}
      </div>

      <div className="text-[10px] text-text-muted absolute bottom-1 right-2 opacity-50">
        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''}
      </div>
    </div>
  );
};

export default BaseWidget;
