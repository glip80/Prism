import { Server, Socket } from 'socket.io';
import { logger } from '../../../shared/utils/logger';
import { refreshService } from '../services/refreshService';
import { widgetService } from '../services/widgetService';

export const setupWebSockets = (io: Server) => {
  // Listen for background refresh events published via Redis
  refreshService.onRefresh(async (widgetId) => {
    // When a widget refresh is triggered globally, we might broadcast
    // the generic "ready to update" or fetch data immediately.
    // In large setups, the client should refetch or the server pushes the fetched payload.
    // Here we just notify all clients subscribed to this widget's room.
    logger.info(`Broadcasting refresh for widget: ${widgetId}`);
    io.to(`widget_${widgetId}`).emit('widget_updated', { widgetId });
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Auth could be done in middleware, assuming socket is authenticated
    socket.on('subscribe_widget', (widgetId: string) => {
      socket.join(`widget_${widgetId}`);
      logger.info(`Socket ${socket.id} subscribed to widget_${widgetId}`);
    });

    socket.on('unsubscribe_widget', (widgetId: string) => {
      socket.leave(`widget_${widgetId}`);
      logger.info(`Socket ${socket.id} unsubscribed from widget_${widgetId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};
