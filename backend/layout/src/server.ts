import app from './app';
import { connectDatabase } from './database/mongo';
import { versioningService } from './services/versioningService';
import { logger } from '../../shared/utils/logger';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const PORT = process.env.PORT || 3002;
const server = http.createServer(app);

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDatabase();
    
    // 2. Init Postgres Schema for versions
    await versioningService.initSchema();

    server.listen(PORT, () => {
      logger.info(`Layout Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Layout Service', error);
    process.exit(1);
  }
};

startServer();
