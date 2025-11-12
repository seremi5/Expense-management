/**
 * Main application entry point
 * Expense Management Backend API
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { HTTP_STATUS } from './config/constants.js';
import ocrRoutes from './routes/ocr.routes.js';

const app: Express = express();

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Expense Management API',
    version: '1.0.0',
    endpoints: {
      ocr: '/api/ocr',
      health: '/health'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// API Routes
app.use('/api/ocr', ocrRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   Expense Management API                  ║
║                                           ║
║   Environment: ${env.NODE_ENV.padEnd(28)} ║
║   Port:        ${PORT.toString().padEnd(28)} ║
║   OCR Model:   ${env.GEMINI_MODEL.padEnd(28)} ║
║                                           ║
║   Endpoints:                              ║
║   - POST /api/ocr/extract/invoice         ║
║   - POST /api/ocr/extract/receipt         ║
║   - GET  /api/ocr/health                  ║
║   - GET  /health                          ║
║                                           ║
║   Server running at http://localhost:${PORT}  ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
