import React from 'react';
import { Plus } from 'lucide-react';
import { PermissionGate } from '../../Common/PermissionGate';

const AddWidgetButton: React.FC = () => {
  return (
    <PermissionGate permission="widget:create">
      <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-surface rounded hover:opacity-90 transition-opacity">
        <Plus size={16} />
        <span className="text-sm font-medium">Add Widget</span>
      </button>
    </PermissionGate>
  );
};

export default AddWidgetButton;
