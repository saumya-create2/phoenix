/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getPayments } from '../controllers/paymentController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getPayments);

export default router;
