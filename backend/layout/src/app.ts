import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import layoutRoutes from './routes/layouts';
import { apiRateLimiter } from '../../shared/middleware/rateLimiter';
import { errorHandler } from '../../shared/middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter as any);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Layout' });
});

app.use('/layouts', layoutRoutes);

app.use(errorHandler as any);

export default app;
