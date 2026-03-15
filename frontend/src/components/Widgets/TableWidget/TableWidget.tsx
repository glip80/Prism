import React from 'react';
import BaseWidget from '../BaseWidget';

interface TableWidgetProps {
  widgetId: string;
  config: any;
}

const TableWidget: React.FC<TableWidgetProps> = ({ widgetId, config }) => {
  const columns = config?.visualization?.columns || [];

  return (
    <BaseWidget widgetId={widgetId} config={config}>
      {(data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          return <div className="flex h-full items-center justify-center text-text-muted text-sm">No data available</div>;
        }

        const colsToRender = columns.length > 0 
          ? columns 
          : Object.keys(data[0]).map(k => ({ key: k, title: k }));

        return (
          <div className="w-full h-full overflow-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr>
                  {colsToRender.map((col: any) => (
                    <th key={col.key} className="p-2 font-semibold text-text border-b border-border shadow-sm">
                      {col.title || col.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-background/50 transition-colors border-b border-border last:border-0">
                    {colsToRender.map((col: any) => (
                      <td key={col.key} className="p-2 text-text">
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }}
    </BaseWidget>
  );
};

export default TableWidget;
