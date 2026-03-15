import { Request, Response } from 'express';
import { widgetService } from '../services/widgetService';
import { refreshService } from '../services/refreshService';

export class WidgetController {
  async getWidgetData(req: Request, res: Response) {
    try {
      const widgetId = req.params.widgetId as string;
      // Config could be passed in body if POST, or queried from DB.
      // Usually the frontend provides the query schema context or the backend knows it. 
      // For flexibility we expect it in body via POST.
      const config = req.body.config || {};
      
      const data = await widgetService.fetchWidgetData(widgetId, config);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async triggerRefresh(req: Request, res: Response) {
    try {
      const widgetId = req.params.widgetId as string;
      
      // Forcing cache invalidation
      const { pubClient } = await import('../services/refreshService');
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      await redis.del(`widget_data:${widgetId}`);

      // PubSub alert
      refreshService.publishRefresh(widgetId);
      
      res.status(200).json({ message: 'Refresh triggered successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const widgetController = new WidgetController();
