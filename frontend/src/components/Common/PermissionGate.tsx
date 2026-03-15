import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface Props {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<Props> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
