import React from 'react';
import { useLayoutStore } from '../../../stores/layoutStore';
import { useLayout } from '../../../hooks/useLayout';

const LayoutSelector: React.FC = () => {
  const { layouts, currentLayout } = useLayoutStore();
  const { loadLayoutById } = useLayout();

  return (
    <select
      className="px-3 py-1.5 border border-border rounded bg-surface text-text text-sm focus:outline-none focus:border-primary"
      value={currentLayout?.id || ''}
      onChange={(e) => loadLayoutById(e.target.value)}
    >
      <option value="" disabled>Select Layout</option>
      {(Array.isArray(layouts) ? layouts : []).map(layout => (
        <option key={layout.id} value={layout.id}>
          {layout.title}
        </option>
      ))}
    </select>
  );
};

export default LayoutSelector;
