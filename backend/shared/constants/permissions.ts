export enum Permission {
  // Layout permissions
  LAYOUT_CREATE = 'layout:create',
  LAYOUT_READ = 'layout:read',
  LAYOUT_UPDATE = 'layout:update',
  LAYOUT_DELETE = 'layout:delete',
  LAYOUT_SHARE = 'layout:share',
  LAYOUT_PUBLISH = 'layout:publish',
  
  // Widget permissions
  WIDGET_CREATE = 'widget:create',
  WIDGET_READ = 'widget:read',
  WIDGET_UPDATE = 'widget:update',
  WIDGET_DELETE = 'widget:delete',
  WIDGET_REFRESH = 'widget:refresh',
  
  // Connector permissions
  CONNECTOR_CREATE = 'connector:create',
  CONNECTOR_READ = 'connector:read',
  CONNECTOR_UPDATE = 'connector:update',
  CONNECTOR_DELETE = 'connector:delete',
  CONNECTOR_TEST = 'connector:test',
  
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  
  // System
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup'
}
