import crypto from 'crypto';

// Polyfill for crypto (needed for MongoDB with Node < 20)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import config from './config';
import connectDB from './config/database';
import routes from './routes';
import { notFound, errorHandler } from './middleware/errorHandler';

// Initialize express
const app: Application = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadPath)));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'TENDRYX Store API',
    version: '1.0.0',
    description: 'API REST para la tienda de perfumes TENDRYX',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api/v1/docs (coming soon)',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server only when not in Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = config.port;

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🌸 TENDRYX Store API                            ║
║                                                   ║
║   Server running on port ${PORT}                    ║
║   Environment: ${config.nodeEnv.padEnd(28)}║
║                                                   ║
║   API: http://localhost:${PORT}/api/v1              ║
║   Health: http://localhost:${PORT}/health           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
  });
}

export default app;
