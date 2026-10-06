/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbService } from './server/services/databaseService.js';
import authRoutes from './server/routes/authRoutes.js';
import roomRoutes from './server/routes/roomRoutes.js';
import roomTypeRoutes from './server/routes/roomTypeRoutes.js';
import serviceRoutes from './server/routes/serviceRoutes.js';
import bookingRoutes from './server/routes/bookingRoutes.js';
import customerRoutes from './server/routes/customerRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import systemRoutes from './server/routes/systemRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Relational Database
await dbService.initialize();

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'StayEase Hotel Management Engine',
    database: 'Relational SQL (3NF)',
    time: new Date().toISOString(),
  });
});

// Mount Vite or static production build
const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));

if (!isProduction) {
  // Mount Vite middleware for HMR-free preview and development
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      port: PORT,
      host: '0.0.0.0',
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);
} else {
  // Production static server
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏨 StayEase Server running on http://0.0.0.0:${PORT}`);
});
