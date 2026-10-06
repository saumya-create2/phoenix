/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT 
        u.user_id AS customer_id,
        u.name,
        u.email,
        u.phone,
        u.created_at AS registration_date,
        c.address,
        c.city,
        c.loyalty_points,
        c.id_proof_type,
        COUNT(b.booking_id) AS total_bookings,
        COALESCE(SUM(CASE WHEN b.booking_status != 'Cancelled' THEN b.total_amount ELSE 0 END), 0) AS total_spent
      FROM users u
      INNER JOIN customers c ON u.user_id = c.customer_id
      LEFT JOIN bookings b ON u.user_id = b.customer_id
      WHERE u.role = 'customer'
    `;

    const params: any[] = [];
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR c.city LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' GROUP BY u.user_id ORDER BY total_bookings DESC, total_spent DESC';

    const customers = dbService.query<any>(sql, params);

    res.json({ success: true, count: customers.length, customers });
  } catch (err: any) {
    console.error('getCustomers error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = parseInt(req.params.id, 10);

    const customer = dbService.queryOne<any>(
      `SELECT 
        u.user_id AS customer_id,
        u.name,
        u.email,
        u.phone,
        u.created_at AS registration_date,
        c.address,
        c.city,
        c.loyalty_points,
        c.id_proof_type,
        c.id_proof_number
      FROM users u
      INNER JOIN customers c ON u.user_id = c.customer_id
      WHERE u.user_id = ?`,
      [customerId]
    );

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Customer's booking history
    const bookings = dbService.query<any>(
      `SELECT 
        b.booking_id,
        b.booking_reference,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        b.booking_status,
        b.payment_status,
        r.room_number,
        rt.name AS room_type_name
      FROM bookings b
      LEFT JOIN booking_rooms br ON b.booking_id = br.booking_id
      LEFT JOIN rooms r ON br.room_id = r.room_id
      LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_id DESC`,
      [customerId]
    );

    res.json({
      success: true,
      customer: {
        ...customer,
        bookings,
      },
    });
  } catch (err: any) {
    console.error('getCustomerById error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve customer dossier' });
  }
};
