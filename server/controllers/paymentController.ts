/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, method } = req.query;

    let sql = `
      SELECT 
        p.payment_id,
        p.booking_id,
        p.transaction_reference,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.card_last_four,
        p.paid_at,
        b.booking_reference,
        u.name AS customer_name,
        u.email AS customer_email
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.booking_id
      INNER JOIN users u ON b.customer_id = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (status && status !== 'All') {
      sql += ' AND p.payment_status = ?';
      params.push(status);
    }
    if (method && method !== 'All') {
      sql += ' AND p.payment_method = ?';
      params.push(method);
    }

    sql += ' ORDER BY p.paid_at DESC';

    const payments = dbService.query<any>(sql, params);

    // Summary totals
    const totalCollected = payments
      .filter((p) => p.payment_status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      count: payments.length,
      totalCollected,
      payments,
    });
  } catch (err: any) {
    console.error('getPayments error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve payments' });
  }
};
