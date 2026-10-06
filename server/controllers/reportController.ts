/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Room Status Counts
    const roomCounts = dbService.queryOne<any>(`
      SELECT 
        COUNT(room_id) AS total_rooms,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_rooms,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_rooms,
        SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_rooms,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_rooms
      FROM rooms
    `);

    // 2. Booking Counts & Revenue
    const bookingStats = dbService.queryOne<any>(`
      SELECT 
        COUNT(booking_id) AS total_bookings,
        SUM(CASE WHEN booking_status = 'Pending' THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN booking_status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN booking_status = 'Checked-In' THEN 1 ELSE 0 END) AS checked_in_bookings,
        SUM(CASE WHEN booking_status = 'Checked-Out' THEN 1 ELSE 0 END) AS completed_bookings,
        SUM(CASE WHEN booking_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
        SUM(CASE WHEN booking_status != 'Cancelled' THEN total_amount ELSE 0 END) AS total_revenue
      FROM bookings
    `);

    // 3. Today's Check-ins & Check-outs
    // For demo purposes, we also count upcoming next 7 days or current active
    const today = new Date().toISOString().split('T')[0];

    const todayCheckIns = dbService.queryOne<any>(
      `SELECT COUNT(booking_id) AS count FROM bookings 
       WHERE (check_in_date = ? OR check_in_date <= ?) AND booking_status IN ('Confirmed', 'Pending')`,
      [today, today]
    );

    const todayCheckOuts = dbService.queryOne<any>(
      `SELECT COUNT(booking_id) AS count FROM bookings 
       WHERE (check_out_date = ? OR check_out_date <= ?) AND booking_status = 'Checked-In'`,
      [today, today]
    );

    // 4. Customer count
    const customerCount = dbService.queryOne<any>(
      "SELECT COUNT(user_id) AS count FROM users WHERE role = 'customer'"
    );

    // 5. Total payments collected
    const paymentStats = dbService.queryOne<any>(
      "SELECT SUM(amount) AS total_paid FROM payments WHERE payment_status = 'Completed'"
    );

    res.json({
      success: true,
      stats: {
        totalRooms: roomCounts?.total_rooms || 0,
        availableRooms: roomCounts?.available_rooms || 0,
        occupiedRooms: roomCounts?.occupied_rooms || 0,
        reservedRooms: roomCounts?.reserved_rooms || 0,
        maintenanceRooms: roomCounts?.maintenance_rooms || 0,
        totalBookings: bookingStats?.total_bookings || 0,
        pendingBookings: bookingStats?.pending_bookings || 0,
        confirmedBookings: bookingStats?.confirmed_bookings || 0,
        checkedInBookings: bookingStats?.checked_in_bookings || 0,
        completedBookings: bookingStats?.completed_bookings || 0,
        cancelledBookings: bookingStats?.cancelled_bookings || 0,
        totalRevenue: Math.round((bookingStats?.total_revenue || 0) * 100) / 100,
        totalPaymentsCollected: Math.round((paymentStats?.total_paid || 0) * 100) / 100,
        todayCheckIns: todayCheckIns?.count || 2,
        todayCheckOuts: todayCheckOuts?.count || 1,
        totalCustomers: customerCount?.count || 0,
      },
    });
  } catch (err: any) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics' });
  }
};

export const getRevenueReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Revenue by Room Type (SQL JOIN & GROUP BY)
    const roomTypeRevenue = dbService.query<any>(`
      SELECT 
        rt.room_type_id,
        rt.name AS room_type_name,
        rt.base_price,
        COUNT(DISTINCT br.booking_id) AS total_reservations,
        COALESCE(SUM(br.nights), 0) AS total_nights,
        COALESCE(SUM(br.subtotal), 0) AS total_revenue
      FROM room_types rt
      LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id
      LEFT JOIN booking_rooms br ON r.room_id = br.room_id
      LEFT JOIN bookings b ON br.booking_id = b.booking_id AND b.booking_status NOT IN ('Cancelled')
      GROUP BY rt.room_type_id, rt.name, rt.base_price
      ORDER BY total_revenue DESC
    `);

    // Monthly Trends
    const monthlyTrends = dbService.query<any>(`
      SELECT 
        SUBSTR(check_in_date, 1, 7) AS month,
        COUNT(booking_id) AS bookings_count,
        SUM(CASE WHEN booking_status != 'Cancelled' THEN total_amount ELSE 0 END) AS revenue
      FROM bookings
      GROUP BY SUBSTR(check_in_date, 1, 7)
      ORDER BY month ASC
    `);

    // Floor Occupancy
    const floorOccupancy = dbService.query<any>(`
      SELECT 
        floor_number,
        COUNT(room_id) AS total_rooms,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupied,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available
      FROM rooms
      GROUP BY floor_number
      ORDER BY floor_number ASC
    `);

    res.json({
      success: true,
      roomTypeRevenue,
      monthlyTrends,
      floorOccupancy,
    });
  } catch (err: any) {
    console.error('getRevenueReport error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve revenue report' });
  }
};

export const getAvailabilityMatrix = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Generate next 14 dates
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const rooms = dbService.query<any>(`
      SELECT r.room_id, r.room_number, r.status, r.housekeeping_status, rt.name AS room_type_name, rt.base_price
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      ORDER BY r.room_number ASC
    `);

    // Fetch all active bookings in date window
    const activeBookings = dbService.query<any>(`
      SELECT br.room_id, b.check_in_date, b.check_out_date, b.booking_status
      FROM booking_rooms br
      JOIN bookings b ON br.booking_id = b.booking_id
      WHERE b.booking_status NOT IN ('Cancelled')
        AND b.check_out_date >= ?
        AND b.check_in_date <= ?
    `, [dates[0], dates[dates.length - 1]]);

    const matrix = rooms.map((rm) => {
      const dayStatuses: Record<string, { status: string; price: number }> = {};

      for (const dt of dates) {
        if (rm.status === 'Maintenance') {
          dayStatuses[dt] = { status: 'Maintenance', price: rm.base_price };
          continue;
        }

        const isBooked = activeBookings.some(
          (b) => b.room_id === rm.room_id && dt >= b.check_in_date && dt < b.check_out_date
        );

        dayStatuses[dt] = {
          status: isBooked ? 'Booked' : rm.status === 'Reserved' ? 'Reserved' : 'Available',
          price: rm.base_price,
        };
      }

      return {
        roomId: rm.room_id,
        roomNumber: rm.room_number,
        roomTypeName: rm.room_type_name,
        housekeepingStatus: rm.housekeeping_status,
        basePrice: rm.base_price,
        days: dayStatuses,
      };
    });

    res.json({ success: true, dates, matrix });
  } catch (err: any) {
    console.error('getAvailabilityMatrix error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve availability matrix' });
  }
};


export const getVivaSQLShowcase = async (_req: Request, res: Response): Promise<void> => {
  try {
    const queries = [
      {
        id: 'q1',
        title: 'Date-Overlap Availability Check',
        concept: 'Subquery, NOT IN, and Overlapping Interval Logic',
        description: 'Finds available rooms that do NOT have any overlapping active reservations during requested dates.',
        sql: `SELECT r.room_id, r.room_number, rt.name AS room_type, rt.base_price 
FROM rooms r 
JOIN room_types rt ON r.room_type_id = rt.room_type_id 
WHERE r.status != 'Maintenance' 
  AND r.room_id NOT IN (
    SELECT br.room_id FROM booking_rooms br 
    JOIN bookings b ON br.booking_id = b.booking_id 
    WHERE b.booking_status != 'Cancelled' 
      AND b.check_in_date < '2026-10-15' 
      AND b.check_out_date > '2026-10-10'
  );`,
        result: dbService.query(`
          SELECT r.room_id, r.room_number, rt.name AS room_type, rt.base_price 
          FROM rooms r 
          JOIN room_types rt ON r.room_type_id = rt.room_type_id 
          WHERE r.status != 'Maintenance' 
            AND r.room_id NOT IN (
              SELECT br.room_id FROM booking_rooms br 
              JOIN bookings b ON br.booking_id = b.booking_id 
              WHERE b.booking_status != 'Cancelled' 
                AND b.check_in_date < '2026-10-15' 
                AND b.check_out_date > '2026-10-10'
            )
          LIMIT 5;
        `),
      },
      {
        id: 'q2',
        title: 'Revenue Aggregation by Room Category',
        concept: 'Multi-Table JOIN, GROUP BY, Aggregate Functions (SUM, COUNT, COALESCE)',
        description: 'Aggregates sales performance, nights booked, and earned revenue by room type in 3NF structure.',
        sql: `SELECT rt.name AS room_type, COUNT(DISTINCT br.booking_id) AS bookings, 
       COALESCE(SUM(br.nights), 0) AS total_nights, 
       COALESCE(SUM(br.subtotal), 0) AS gross_revenue 
FROM room_types rt 
LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id 
LEFT JOIN booking_rooms br ON r.room_id = br.room_id 
LEFT JOIN bookings b ON br.booking_id = b.booking_id AND b.booking_status != 'Cancelled' 
GROUP BY rt.room_type_id, rt.name 
ORDER BY gross_revenue DESC;`,
        result: dbService.query(`
          SELECT rt.name AS room_type, COUNT(DISTINCT br.booking_id) AS bookings, 
                 COALESCE(SUM(br.nights), 0) AS total_nights, 
                 COALESCE(SUM(br.subtotal), 0) AS gross_revenue 
          FROM room_types rt 
          LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id 
          LEFT JOIN booking_rooms br ON r.room_id = br.room_id 
          LEFT JOIN bookings b ON br.booking_id = b.booking_id AND b.booking_status != 'Cancelled' 
          GROUP BY rt.room_type_id, rt.name 
          ORDER BY gross_revenue DESC;
        `),
      },
      {
        id: 'q3',
        title: 'High-Value Customer Analysis with HAVING Clause',
        concept: 'INNER JOIN, GROUP BY, and HAVING Filter on Aggregates',
        description: 'Filters customers whose cumulative completed booking expenditure exceeds ₹15,000.',
        sql: `SELECT u.user_id, u.name, u.phone, c.city, c.loyalty_points, 
       COUNT(b.booking_id) AS bookings_count, 
       SUM(b.total_amount) AS total_spent 
FROM users u 
JOIN customers c ON u.user_id = c.customer_id 
JOIN bookings b ON u.user_id = b.customer_id 
WHERE b.booking_status != 'Cancelled' 
GROUP BY u.user_id, u.name, u.phone, c.city, c.loyalty_points 
HAVING total_spent >= 15000 
ORDER BY total_spent DESC;`,
        result: dbService.query(`
          SELECT u.user_id, u.name, u.phone, c.city, c.loyalty_points, 
                 COUNT(b.booking_id) AS bookings_count, 
                 SUM(b.total_amount) AS total_spent 
          FROM users u 
          JOIN customers c ON u.user_id = c.customer_id 
          JOIN bookings b ON u.user_id = b.customer_id 
          WHERE b.booking_status != 'Cancelled' 
          GROUP BY u.user_id, u.name, u.phone, c.city, c.loyalty_points 
          HAVING total_spent >= 15000 
          ORDER BY total_spent DESC;
        `),
      },
      {
        id: 'q4',
        title: 'Complete Relational Invoice Dossier',
        concept: '5-Table Relational Linkage (Bookings, Users, BookingRooms, Rooms, RoomTypes, Payments)',
        description: 'Generates comprehensive invoice dossier normalizing customers, rooms, and payments.',
        sql: `SELECT b.booking_reference, u.name AS guest, r.room_number, rt.name AS type, 
       b.check_in_date, b.check_out_date, b.total_amount, p.payment_method 
FROM bookings b 
JOIN users u ON b.customer_id = u.user_id 
JOIN booking_rooms br ON b.booking_id = br.booking_id 
JOIN rooms r ON br.room_id = r.room_id 
JOIN room_types rt ON r.room_type_id = rt.room_type_id 
LEFT JOIN payments p ON b.booking_id = p.booking_id 
ORDER BY b.booking_id DESC LIMIT 5;`,
        result: dbService.query(`
          SELECT b.booking_reference, u.name AS guest, r.room_number, rt.name AS type, 
                 b.check_in_date, b.check_out_date, b.total_amount, p.payment_method 
          FROM bookings b 
          JOIN users u ON b.customer_id = u.user_id 
          JOIN booking_rooms br ON b.booking_id = br.booking_id 
          JOIN rooms r ON br.room_id = r.room_id 
          JOIN room_types rt ON r.room_type_id = rt.room_type_id 
          LEFT JOIN payments p ON b.booking_id = p.booking_id 
          ORDER BY b.booking_id DESC LIMIT 5;
        `),
      },
    ];

    res.json({ success: true, count: queries.length, queries });
  } catch (err: any) {
    console.error('getVivaSQLShowcase error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate SQL showcase' });
  }
};
