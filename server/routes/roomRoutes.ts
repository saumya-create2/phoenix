/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom, updateHousekeepingStatus } from '../controllers/roomController.js';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, getRooms);
router.get('/:id', optionalAuth, getRoomById);
router.post('/', authenticateToken, requireAdmin, createRoom);
router.put('/:id', authenticateToken, requireAdmin, updateRoom);
router.put('/:id/housekeeping', authenticateToken, requireAdmin, updateHousekeepingStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteRoom);

export default router;
