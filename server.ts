import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { connectToMongoDB } from './server/db/mongodb';
import { db } from './server/db/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for Vite hot reload / iframe development preview
      crossOriginEmbedderPolicy: false
    })
  );

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow all origins in development and preview environments
        callback(null, true);
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SafeCart Cybersecurity Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api', apiRouter);

  // Centralized Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SafeCart Server Error]:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'An internal cybersecurity server error occurred.',
      errorCode: err.code || 'INTERNAL_SERVER_ERROR'
    });
  });

  // Vite Middleware / Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeCart Security Server] Listening on http://0.0.0.0:${PORT}`);

    // Initialize MongoDB Atlas Connection in background (non-blocking)
    (async () => {
      try {
        await connectToMongoDB();
        await db.syncWithMongoDB();
      } catch (dbErr: any) {
        console.warn('[SafeCart Database Notice] MongoDB initialization error:', dbErr?.message);
      }
    })();
  });
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]:', err);
});
