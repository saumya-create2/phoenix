/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  validateCoupon,
} from '../controllers/bookingController.js';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getBookings);
router.get('/:id', optionalAuth, getBookingById);
router.post('/', optionalAuth, createBooking);
router.post('/validate-coupon', validateCoupon);
router.put('/:id/status', authenticateToken, requireAdmin, updateBookingStatus);
router.put('/:id/cancel', optionalAuth, cancelBooking);

export default router;
