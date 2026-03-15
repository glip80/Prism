import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import { apiRateLimiter } from '../../shared/middleware/rateLimiter';
import { errorHandler } from '../../shared/middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter as any);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Auth' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
