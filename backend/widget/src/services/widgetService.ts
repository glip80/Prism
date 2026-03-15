import axios from 'axios';
import Redis from 'ioredis';
import { logger } from '../../../shared/utils/logger';

const CONNECTOR_API_URL = process.env.CONNECTOR_API_URL || 'http://localhost:8000';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class WidgetService {
  async fetchWidgetData(widgetId: string, config: any) {
    // Check Cache First
    const cacheKey = `widget_data:${widgetId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    try {
      // Real-time fetch through python connector
      // Config holds the connector_id, query type, and connector credentials
      const response = await axios.post(`${CONNECTOR_API_URL}/api/v1/execute`, {
        widgetId,
        config
      });
      
      const data = response.data;
      
      // Cache with short TTL to dampen loads
      await redis.setex(cacheKey, 60, JSON.stringify(data));
      
      return data;
    } catch (error: any) {
      logger.error(`Failed fetching connector data for widget ${widgetId}:`, error.message);
      throw new Error('Failed to fetch widget data from connector');
    }
  }
}

export const widgetService = new WidgetService();
