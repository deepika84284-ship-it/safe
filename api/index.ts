import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SafeCart Cybersecurity Engine (Vercel Serverless)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main API Routes mounted on both /api and root
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SafeCart Vercel API Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal cybersecurity server error occurred.',
    errorCode: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
