import app from './app';
import { initializeDatabase } from './database/config';
import { logger } from '../../shared/utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Auth Service', error);
    process.exit(1);
  }
};

startServer();
