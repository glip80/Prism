import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  return {
    user,
    hasPermission,
    canCreateLayout: hasPermission('layout:create'),
    canEditLayout: hasPermission('layout:update'),
    canDeleteLayout: hasPermission('layout:delete'),
    canCreateWidget: hasPermission('widget:create'),
    canEditWidget: hasPermission('widget:update'),
    canDeleteWidget: hasPermission('widget:delete'),
  };
};
