import Redis from 'ioredis';
import { logger } from '../../../shared/utils/logger';

const redisHost = process.env.REDIS_URL || 'redis://localhost:6379';
export const pubClient = new Redis(redisHost);
export const subClient = new Redis(redisHost);

export class RefreshService {
  publishRefresh(widgetId: string) {
    // This pub/sub forces any listening websocket node to broadcast the update
    pubClient.publish('widget_refresh', widgetId);
    logger.info(`Published refresh request for widget ${widgetId}`);
  }
  
  onRefresh(callback: (widgetId: string) => void) {
    subClient.subscribe('widget_refresh', (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to widget_refresh channel', err);
      }
    });

    subClient.on('message', (channel, message) => {
      if (channel === 'widget_refresh') {
        callback(message);
      }
    });
  }
}

export const refreshService = new RefreshService();
