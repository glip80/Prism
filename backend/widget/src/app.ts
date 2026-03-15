import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import widgetRoutes from './routes/widgets';
import { apiRateLimiter } from '../../shared/middleware/rateLimiter';
import { errorHandler } from '../../shared/middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Widget' });
});

app.use('/widgets', widgetRoutes);

app.use(errorHandler);

export default app;
