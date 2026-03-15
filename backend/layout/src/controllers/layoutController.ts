import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import Redis from 'ioredis';

// Errors
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) { super(message); }
}
export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) { super(message); }
}
export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) { super(message); }
}

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
});

const mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Mock logger
const logger = {
  info: console.log,
  error: console.error
};

export class LayoutController {
  // Get layout with async caching
  async getLayout(req: Request, res: Response) {
    const layoutId = req.params.layoutId as string;
    const userId = (req as any).user?.id || 'anonymous';
    
    // Try cache first (async)
    const cached = await redis.get(`cache:layout:${layoutId}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Fetch from MongoDB (async)
    const layout = await mongoClient.db().collection('layouts').findOne({
      _id: new ObjectId(layoutId),
      $or: [
        { created_by: userId },
        { shared_with: userId },
        { is_public: true }
      ],
      deleted_at: null
    });
    
    if (!layout) {
      throw new NotFoundError('Layout not found');
    }
    
    // Check permissions (async)
    const hasPermission = await this.checkLayoutPermission(userId, layout, 'read');
    if (!hasPermission) {
      throw new ForbiddenError('Access denied');
    }
    
    // Populate cache (fire and forget, but handle errors)
    redis.setex(`cache:layout:${layoutId}`, 300, JSON.stringify(layout))
      .catch(err => logger.error('Cache set failed', err));
    
    res.json(layout);
  }

  // Update layout with versioning (async transaction)
  async updateLayout(req: Request, res: Response) {
    const layoutId = req.params.layoutId as string;
    const updates = req.body;
    const userId = (req as any).user?.id || 'anonymous';
    
    // Distributed lock to prevent concurrent edits
    const lockKey = `lock:layout_edit:${layoutId}`;
    const lock = await redis.set(lockKey, userId, 'EX', 30, 'NX');
    
    if (!lock) {
      throw new ConflictError('Layout is being edited by another user');
    }
    
    try {
      // Get current version
      const current = await mongoClient.db().collection('layouts').findOne(
        { _id: new ObjectId(layoutId) },
        { projection: { version: 1, widgets: 1 } }
      );

      if (!current) throw new NotFoundError('Layout not found');
      
      const nextVersion = (current.version || 0) + 1;
      
      // Create version snapshot in PostgreSQL (async)
      await pgPool.query(
        `INSERT INTO layout_versions (layout_id, version_number, created_by, change_summary, layout_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [layoutId, nextVersion, userId, updates.changeSummary || 'Update', current]
      );
      
      // Update in MongoDB (async)
      const result = await mongoClient.db().collection('layouts').findOneAndUpdate(
        { _id: new ObjectId(layoutId) },
        {
          $set: {
            ...updates,
            version: nextVersion,
            updated_at: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      
      // Invalidate cache (async)
      await redis.del(`cache:layout:${layoutId}`);
      
      // Broadcast update to connected clients (async)
      await redis.publish(`pubsub:layout_updates:${layoutId}`, JSON.stringify({
        type: 'layout_updated',
        layoutId,
        updatedBy: userId,
        timestamp: new Date()
      }));
      
      res.json(result || {});
    } finally {
      await redis.del(lockKey);  // Release lock
    }
  }

  // Async permission check
  private async checkLayoutPermission(userId: string, layout: any, action: string): Promise<boolean> {
    if (layout.created_by === userId) return true;
    if (layout.is_public && action === 'read') return true;
    
    // Check user roles (async DB query)
    try {
      const { rows } = await pgPool.query(
        `SELECT r.permissions FROM users u 
         JOIN user_roles ur ON u.id = ur.user_id 
         JOIN roles r ON ur.role_id = r.id 
         WHERE u.id = $1`,
        [userId]
      );
      
      return rows.some(row => row.permissions?.includes(`layout:${action}`));
    } catch(err) {
      return false; // Safely fail
    }
  }
}
