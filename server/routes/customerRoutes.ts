/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getCustomers, getCustomerById } from '../controllers/customerController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getCustomers);
router.get('/:id', authenticateToken, requireAdmin, getCustomerById);

export default router;
