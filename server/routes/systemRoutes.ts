/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';
import { stayEaseHotel } from '../models/Hotel.js';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Get Hotel info
router.get('/hotel-info', (_req: Request, res: Response) => {
  res.json({ success: true, hotel: stayEaseHotel.getHotelSummary() });
});

// Reviews
router.get('/reviews', (_req: Request, res: Response) => {
  try {
    const reviews = dbService.query<any>(`
      SELECT 
        rev.review_id,
        rev.customer_id,
        rev.room_type_id,
        rev.rating,
        rev.comment,
        rev.guest_name,
        rev.created_at,
        rt.name AS room_type_name
      FROM reviews rev
      LEFT JOIN room_types rt ON rev.room_type_id = rt.room_type_id
      ORDER BY rev.created_at DESC
    `);
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews' });
  }
});

router.post('/reviews', optionalAuth, (req: Request, res: Response) => {
  try {
    const { roomTypeId, rating, comment, guestName } = req.body;
    if (!roomTypeId || !rating || !comment) {
      res.status(400).json({ success: false, message: 'Rating and comment are required' });
      return;
    }

    const customerId = req.user?.userId || 2;
    const name = guestName || req.user?.name || 'Valued Guest';

    const insertRes = dbService.run(
      'INSERT INTO reviews (customer_id, room_type_id, rating, comment, guest_name) VALUES (?, ?, ?, ?, ?)',
      [customerId, roomTypeId, Math.min(5, Math.max(1, rating)), comment.trim(), name]
    );

    res.status(201).json({
      success: true,
      message: 'Review posted! Thank you for sharing your experience.',
      reviewId: insertRes.lastInsertRowid,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to post review' });
  }
});

// Reset demo database to initial state (Admin only)
router.post('/reset-demo', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await dbService.resetDemoData();
    res.json({
      success: true,
      message: 'Database successfully reset to initial pristine demo state with all sample rooms, bookings, and users.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to reset demo database' });
  }
});

export default router;
