/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getDashboardStats, getRevenueReport, getVivaSQLShowcase, getAvailabilityMatrix } from '../controllers/reportController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);
router.get('/revenue', authenticateToken, requireAdmin, getRevenueReport);
router.get('/availability-matrix', authenticateToken, requireAdmin, getAvailabilityMatrix);
router.get('/sql-viva', authenticateToken, requireAdmin, getVivaSQLShowcase);

export default router;
