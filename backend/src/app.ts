import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import loadRoutes from './routes/loadRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import parserRoutes from './routes/parserRoutes.js';
import corridorRoutes from './routes/corridorRoutes.js';
import ulipRoutes from './routes/ulipRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SupplySync B2B Freight Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/corridors', corridorRoutes);
app.use('/api/ulip', ulipRoutes);

// API 404 Guard: Never serve index.html for unmatched /api requests
app.all('/api/{*path}', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// Cloud Deployment (Render.com): Serve Compiled Frontend
// Single-Service Architecture: Express serves React static assets
// ==========================================
const possibleFrontendPaths = [
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/build'),
  path.resolve(process.cwd(), '../frontend/build'),
  path.resolve(__dirname, '../../frontend/build'),
];

const frontendDistPath = possibleFrontendPaths.find((dir) => fs.existsSync(dir));

if (frontendDistPath) {
  console.log(`[SupplySync Cloud] Serving static frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA client-side fallback for all non-API GET routes (Express 5 syntax)
  app.get('{*path}', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  console.log('[SupplySync Cloud] Running in API-only mode (frontend build directory not found)');
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SupplySync Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});
