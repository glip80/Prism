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

// Predefined roles
export const ROLES = {
  SUPER_ADMIN: {
    name: 'super_admin',
    permissions: Object.values(Permission),
    description: 'Full system access'
  },
  ADMIN: {
    name: 'admin',
    permissions: [
      Permission.LAYOUT_CREATE, Permission.LAYOUT_READ, Permission.LAYOUT_UPDATE, 
      Permission.LAYOUT_DELETE, Permission.LAYOUT_SHARE,
      Permission.WIDGET_CREATE, Permission.WIDGET_READ, Permission.WIDGET_UPDATE, 
      Permission.WIDGET_DELETE, Permission.WIDGET_REFRESH,
      Permission.CONNECTOR_CREATE, Permission.CONNECTOR_READ, Permission.CONNECTOR_UPDATE, 
      Permission.CONNECTOR_DELETE, Permission.CONNECTOR_TEST,
      Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE,
      Permission.SYSTEM_SETTINGS, Permission.SYSTEM_LOGS
    ]
  },
  EDITOR: {
    name: 'editor',
    permissions: [
      Permission.LAYOUT_CREATE, Permission.LAYOUT_READ, Permission.LAYOUT_UPDATE, 
      Permission.LAYOUT_SHARE,
      Permission.WIDGET_CREATE, Permission.WIDGET_READ, Permission.WIDGET_UPDATE, 
      Permission.WIDGET_DELETE, Permission.WIDGET_REFRESH,
      Permission.CONNECTOR_READ, Permission.CONNECTOR_TEST
    ]
  },
  VIEWER: {
    name: 'viewer',
    permissions: [
      Permission.LAYOUT_READ,
      Permission.WIDGET_READ, Permission.WIDGET_REFRESH,
      Permission.CONNECTOR_READ
    ]
  }
};
