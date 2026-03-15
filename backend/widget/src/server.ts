import app from './app';
import { setupWebSockets } from './websocket/handler';
import { logger } from '../../shared/utils/logger';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 3003;
const server = http.createServer(app);

// Setup Socket.IO Server for live widget updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupWebSockets(io);

const startServer = () => {
  try {
    server.listen(PORT, () => {
      logger.info(`Widget Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Widget Service', error);
    process.exit(1);
  }
};

startServer();
