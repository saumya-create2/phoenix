/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getRoomTypes, createRoomType, updateRoomType, deleteRoomType } from '../controllers/roomTypeController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getRoomTypes);
router.post('/', authenticateToken, requireAdmin, createRoomType);
router.put('/:id', authenticateToken, requireAdmin, updateRoomType);
router.delete('/:id', authenticateToken, requireAdmin, deleteRoomType);

export default router;
