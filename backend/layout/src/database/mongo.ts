import mongoose from 'mongoose';
import { logger } from '../../../shared/utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/layout_service';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB (Layout Service)');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
