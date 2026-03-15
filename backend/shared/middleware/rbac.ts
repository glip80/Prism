import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Permission } from '../constants/permissions';
import { AuthRequest } from './auth';

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app_user:app_password@localhost:5432/modular_db',
  max: 20
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = user.id;
      
      // Check cache first
      const cacheKey = `permissions:${userId}`;
      let permissionsStr = await redis.get(cacheKey);
      let permissions: string[] = [];
      
      if (!permissionsStr) {
        // Fetch from DB
        const { rows } = await pgPool.query(
          `SELECT DISTINCT jsonb_array_elements_text(r.permissions) as perm 
           FROM users u 
           JOIN user_roles ur ON u.id = ur.user_id 
           JOIN roles r ON ur.role_id = r.id 
           WHERE u.id = $1 AND u.is_active = true`,
          [userId]
        );
        
        permissions = rows.map((r: any) => r.perm);
        if (permissions.length > 0) {
          await redis.setex(cacheKey, 300, JSON.stringify(permissions));
        }
      } else {
        permissions = JSON.parse(permissionsStr);
      }
      
      if (!permissions.includes(permission) && !permissions.includes('*')) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(500).json({ error: 'Internal Server Error during permission validation' });
    }
  };
};
