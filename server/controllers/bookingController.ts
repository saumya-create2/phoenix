/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';
import { CashPayment, DemoCardPayment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { HotelService } from '../models/Service.js';

export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { status, search } = req.query;
    let sql = `
      SELECT 
        b.booking_id,
        b.booking_reference,
        b.customer_id,
        b.check_in_date,
        b.check_out_date,
        b.total_guests,
        b.room_charges,
        b.services_charges,
        b.tax_amount,
        b.total_amount,
        b.booking_status,
        b.payment_status,
        b.special_requests,
        b.created_at,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        r.room_id,
        r.room_number,
        rt.name AS room_type_name,
        rt.bed_type,
        rt.image_url AS room_type_image,
        p.payment_method,
        p.transaction_reference
      FROM bookings b
      INNER JOIN users u ON b.customer_id = u.user_id
      INNER JOIN booking_rooms br ON b.booking_id = br.booking_id
      INNER JOIN rooms r ON br.room_id = r.room_id
      INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // If customer, only show their own bookings
    if (user.role === 'customer') {
      sql += ' AND b.customer_id = ?';
      params.push(user.userId);
    }

    if (status && status !== 'All') {
      sql += ' AND b.booking_status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (b.booking_reference LIKE ? OR u.name LIKE ? OR r.room_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY b.booking_id DESC';

    const rawBookings = dbService.query<any>(sql, params);

    // Group by booking_id so multi-room cart bookings appear as a single consolidated booking with all rooms listed
    const bookingMap = new Map<number, any>();
    for (const b of rawBookings) {
      if (!bookingMap.has(b.booking_id)) {
        bookingMap.set(b.booking_id, {
          bookingId: b.booking_id,
          bookingReference: b.booking_reference,
          customerId: b.customer_id,
          customerName: b.customer_name,
          customerEmail: b.customer_email,
          customerPhone: b.customer_phone,
          checkInDate: b.check_in_date,
          checkOutDate: b.check_out_date,
          totalGuests: b.total_guests,
          roomCharges: b.room_charges,
          servicesCharges: b.services_charges,
          taxAmount: b.tax_amount,
          totalAmount: b.total_amount,
          bookingStatus: b.booking_status,
          paymentStatus: b.payment_status,
          specialRequests: b.special_requests,
          paymentMethod: b.payment_method,
          transactionReference: b.transaction_reference,
          createdAt: b.created_at,
          room: {
            roomId: b.room_id,
            roomNumber: b.room_number,
            roomTypeName: b.room_type_name,
            bedType: b.bed_type,
            imageUrl: b.room_type_image,
          },
          roomsList: [
            {
              roomId: b.room_id,
              roomNumber: b.room_number,
              roomTypeName: b.room_type_name,
            },
          ],
        });
      } else {
        const existing = bookingMap.get(b.booking_id)!;
        if (!existing.roomsList.some((r: any) => r.roomId === b.room_id)) {
          existing.roomsList.push({
            roomId: b.room_id,
            roomNumber: b.room_number,
            roomTypeName: b.room_type_name,
          });
          existing.room.roomNumber = existing.roomsList.map((r: any) => r.roomNumber).join(', ');
          // Summarize room types e.g. "2× Standard Room"
          const counts = new Map<string, number>();
          for (const r of existing.roomsList) {
            counts.set(r.roomTypeName, (counts.get(r.roomTypeName) || 0) + 1);
          }
          existing.room.roomTypeName = Array.from(counts.entries())
            .map(([name, qty]) => (qty > 1 ? `${qty}× ${name}` : name))
            .join(' + ');
        }
      }
    }

    const bookings = Array.from(bookingMap.values());

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err: any) {
    console.error('getBookings error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings' });
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const user = req.user;

    const b = dbService.queryOne<any>(
      `SELECT 
        b.*,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        c.address,
        c.city
      FROM bookings b
      INNER JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN customers c ON u.user_id = c.customer_id
      WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!b) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Role check: customer can only view own booking
    if (user && user.role === 'customer' && b.customer_id !== user.userId) {
      res.status(403).json({ success: false, message: 'Access denied to this booking dossier' });
      return;
    }

    // Get rooms
    const rooms = dbService.query<any>(
      `SELECT 
        br.*,
        r.room_number,
        r.floor_number,
        rt.name AS room_type_name,
        rt.bed_type,
        rt.image_url AS room_type_image
      FROM booking_rooms br
      INNER JOIN rooms r ON br.room_id = r.room_id
      INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE br.booking_id = ?`,
      [bookingId]
    );

    // Get services
    const services = dbService.query<any>(
      `SELECT 
        bs.*,
        s.name AS service_name,
        s.charge_type,
        s.icon
      FROM booking_services bs
      INNER JOIN services s ON bs.service_id = s.service_id
      WHERE bs.booking_id = ?`,
      [bookingId]
    );

    // Get payments
    const payments = dbService.query<any>(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY paid_at DESC',
      [bookingId]
    );

    res.json({
      success: true,
      booking: {
        bookingId: b.booking_id,
        bookingReference: b.booking_reference,
        customerId: b.customer_id,
        customerName: b.customer_name,
        customerEmail: b.customer_email,
        customerPhone: b.customer_phone,
        customerAddress: b.address,
        customerCity: b.city,
        checkInDate: b.check_in_date,
        checkOutDate: b.check_out_date,
        totalGuests: b.total_guests,
        roomCharges: b.room_charges,
        servicesCharges: b.services_charges,
        taxAmount: b.tax_amount,
        totalAmount: b.total_amount,
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status,
        specialRequests: b.special_requests,
        createdAt: b.created_at,
        rooms,
        services,
        payments,
      },
    });
  } catch (err: any) {
    console.error('getBookingById error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
      return;
    }

    const coupon = dbService.queryOne<any>(
      'SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1',
      [code.trim()]
    );

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
      return;
    }

    if (subtotal < coupon.min_spend) {
      res.status(400).json({
        success: false,
        message: `This coupon requires a minimum spend of ₹${coupon.min_spend.toLocaleString('en-IN')}.`,
      });
      return;
    }

    const discountAmount = Math.round((subtotal * coupon.discount_percent) / 100);

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied! ${coupon.discount_percent}% off`,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        description: coupon.description,
        discountAmount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      roomId,
      cartItems, // Optional Array of { roomTypeId: number, quantity: number }
      checkInDate,
      checkOutDate,
      totalGuests = 1,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests = '',
      selectedServices = [], // Array of { serviceId, quantity }
      paymentMethod = 'Demo Card Payment',
      paymentModeSelected = 'full', // 'full' | 'deposit_25' | 'pay_at_hotel'
      couponCode,
      cardDetails, // { cardNumber, cardHolder, expiry, cvv }
    } = req.body;

    const hasCartItems = Array.isArray(cartItems) && cartItems.length > 0;
    if ((!roomId && !hasCartItems) || !checkInDate || !checkOutDate) {
      res.status(400).json({ success: false, message: 'Room selection and reservation dates are required.' });
      return;
    }

    // Verify date sequence
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) {
      res.status(400).json({ success: false, message: 'Check-out date must be after check-in date.' });
      return;
    }

    const diffDays = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));

    // Find rooms already booked in [checkInDate, checkOutDate)
    const overlappingRows = dbService.query<{ room_id: number }>(
      `SELECT DISTINCT br.room_id
       FROM booking_rooms br
       INNER JOIN bookings b ON br.booking_id = b.booking_id
       WHERE b.booking_status NOT IN ('Cancelled', 'Checked-Out')
         AND b.check_in_date < ?
         AND b.check_out_date > ?`,
      [checkOutDate, checkInDate]
    );
    const bookedRoomIds = new Set<number>(overlappingRows.map((r) => r.room_id));

    // Allocate physical rooms for the booking (either from cartItems or single roomId)
    const allocatedRooms: {
      room_id: number;
      room_number: string;
      room_type_id: number;
      base_price: number;
      room_type_name: string;
    }[] = [];

    if (hasCartItems) {
      for (const item of cartItems) {
        const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
        const rTypeId = parseInt(String(item.roomTypeId), 10);
        const candidates = dbService.query<any>(
          `SELECT r.room_id, r.room_number, r.room_type_id, r.status, rt.base_price, rt.name AS room_type_name
           FROM rooms r
           INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
           WHERE r.room_type_id = ? AND r.status = 'Available'
           ORDER BY r.room_id ASC`,
          [rTypeId]
        );
        const availableForType = candidates.filter((c) => !bookedRoomIds.has(c.room_id));
        if (availableForType.length < qty) {
          const typeName = candidates[0]?.room_type_name || 'selected category';
          res.status(409).json({
            success: false,
            message: `Only ${availableForType.length} room(s) in ${typeName} are available for ${checkInDate} to ${checkOutDate} (requested ${qty}).`,
          });
          return;
        }
        for (let i = 0; i < qty; i++) {
          allocatedRooms.push(availableForType[i]);
          bookedRoomIds.add(availableForType[i].room_id);
        }
      }
    } else {
      if (bookedRoomIds.has(Number(roomId))) {
        res.status(409).json({
          success: false,
          message: 'This room has already been booked for the requested dates. Please choose different dates or another room.',
        });
        return;
      }

      const roomInfo = dbService.queryOne<any>(
        `SELECT r.room_id, r.room_number, r.room_type_id, rt.base_price, rt.name AS room_type_name
         FROM rooms r
         INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
         WHERE r.room_id = ?`,
        [roomId]
      );

      if (!roomInfo) {
        res.status(404).json({ success: false, message: 'Selected room not found.' });
        return;
      }
      allocatedRooms.push(roomInfo);
    }

    // Identify customer ID: either logged in user, or find/create customer by email
    let customerId: number;
    if (req.user) {
      customerId = req.user.userId;
    } else {
      if (!guestEmail || !guestName) {
        res.status(400).json({ success: false, message: 'Guest name and email are required for booking.' });
        return;
      }
      const existingUser = dbService.queryOne<any>('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)', [guestEmail.trim()]);
      if (existingUser) {
        customerId = existingUser.user_id;
      } else {
        // Create quick guest customer account
        const userInsert = dbService.run(
          'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
          [guestName.trim(), guestEmail.trim().toLowerCase(), 'demo_guest_hash', guestPhone || '+91 99999 88888', 'customer']
        );
        customerId = userInsert.lastInsertRowid;
        dbService.run('INSERT INTO customers (customer_id, loyalty_points) VALUES (?, ?)', [customerId, 20]);
      }
    }

    // Calculate combined room charges across all allocated rooms
    const roomCharges = allocatedRooms.reduce((sum, r) => sum + r.base_price * diffDays, 0);

    // Calculate services charges using OOPS HotelService logic
    let servicesCharges = 0;
    const serviceItemsToInsert: { serviceId: number; quantity: number; unitPrice: number; subtotal: number }[] = [];

    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      for (const item of selectedServices) {
        const sRow = dbService.queryOne<any>('SELECT * FROM services WHERE service_id = ? AND is_active = 1', [item.serviceId]);
        if (sRow) {
          const serviceModel = new HotelService(
            sRow.service_id,
            sRow.name,
            sRow.description,
            sRow.price,
            sRow.charge_type,
            sRow.icon,
            Boolean(sRow.is_active)
          );
          const qty = item.quantity || 1;
          const subtotal = serviceModel.computeCharge(diffDays, totalGuests, qty);
          servicesCharges += subtotal;
          serviceItemsToInsert.push({
            serviceId: sRow.service_id,
            quantity: qty,
            unitPrice: sRow.price,
            subtotal,
          });
        }
      }
    }

    // Calculate Discount from Coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const cRow = dbService.queryOne<any>(
        'SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1',
        [couponCode.trim()]
      );
      if (cRow) {
        appliedCoupon = cRow.code;
        discountAmount = Math.round(((roomCharges + servicesCharges) * cRow.discount_percent) / 100);
      }
    }

    // Calculate Taxes & Grand Total (12% GST)
    const preTaxTotal = Math.max(0, roomCharges + servicesCharges - discountAmount);
    const taxAmount = Math.round(preTaxTotal * 0.12 * 100) / 100;
    const totalAmount = Math.round((preTaxTotal + taxAmount) * 100) / 100;

    // Determine initial charge amount (full vs 25% deposit vs pay at hotel)
    let chargeAmount = totalAmount;
    if (paymentModeSelected === 'deposit_25') {
      chargeAmount = Math.round(totalAmount * 0.25 * 100) / 100;
    } else if (paymentModeSelected === 'pay_at_hotel') {
      chargeAmount = totalAmount;
    }

    // Generate unique booking reference
    const refYear = new Date().getFullYear();
    const refRandom = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `SE-${refYear}-${refRandom}`;

    // Insert Booking Header
    const bookingInsert = dbService.run(
      `INSERT INTO bookings (
        booking_reference, customer_id, check_in_date, check_out_date,
        total_guests, room_charges, services_charges, tax_amount, total_amount,
        coupon_code, discount_amount, payment_mode_selected,
        booking_status, payment_status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingReference,
        customerId,
        checkInDate,
        checkOutDate,
        totalGuests,
        roomCharges,
        servicesCharges,
        taxAmount,
        totalAmount,
        appliedCoupon,
        discountAmount,
        paymentModeSelected,
        'Confirmed', // Reservation is confirmed immediately upon booking
        paymentMethod === 'Demo Card Payment' ? 'Paid' : 'Pending',
        specialRequests,
      ]
    );

    const bookingId = bookingInsert.lastInsertRowid;

    // Insert into booking_rooms junction for every allocated room
    for (const ar of allocatedRooms) {
      dbService.run(
        'INSERT INTO booking_rooms (booking_id, room_id, price_per_night, nights, subtotal) VALUES (?, ?, ?, ?, ?)',
        [bookingId, ar.room_id, ar.base_price, diffDays, ar.base_price * diffDays]
      );
    }

    // Insert into booking_services junction
    for (const s of serviceItemsToInsert) {
      dbService.run(
        'INSERT INTO booking_services (booking_id, service_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [bookingId, s.serviceId, s.quantity, s.unitPrice, s.subtotal]
      );
    }

    // Process Payment Polymorphism (OOPS: CashPayment vs DemoCardPayment)
    let paymentProcessor;
    let paymentResult;

    if (paymentMethod === 'Cash at Hotel') {
      paymentProcessor = new CashPayment(bookingId, totalAmount);
      paymentResult = await paymentProcessor.processPayment();
      dbService.run(
        'INSERT INTO payments (booking_id, transaction_reference, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)',
        [bookingId, paymentResult.transactionReference, totalAmount, 'Cash at Hotel', 'Completed']
      );
    } else {
      // Demo Card Payment
      const cardNum = cardDetails?.cardNumber || '4242 4242 4242 4242';
      const cardHolder = cardDetails?.cardHolder || guestName || 'Aditya Mehta';
      paymentProcessor = new DemoCardPayment(bookingId, chargeAmount, cardNum, cardHolder);
      paymentResult = await paymentProcessor.processPayment(cardDetails);
      dbService.run(
        'INSERT INTO payments (booking_id, transaction_reference, amount, payment_method, payment_status, card_last_four) VALUES (?, ?, ?, ?, ?, ?)',
        [bookingId, paymentResult.transactionReference, chargeAmount, 'Demo Card Payment', 'Completed', paymentProcessor.cardLastFour]
      );
    }

    // Summarize room numbers and room types for response
    const combinedRoomNumbers = allocatedRooms.map((r) => r.room_number).join(', ');
    const typeCounts = new Map<string, number>();
    for (const r of allocatedRooms) {
      typeCounts.set(r.room_type_name, (typeCounts.get(r.room_type_name) || 0) + 1);
    }
    const combinedRoomTypeNames = Array.from(typeCounts.entries())
      .map(([name, qty]) => (qty > 1 ? `${qty}× ${name}` : name))
      .join(' + ');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking: {
        bookingId,
        bookingReference,
        roomNumber: combinedRoomNumbers,
        roomTypeName: combinedRoomTypeNames,
        roomsBookedCount: allocatedRooms.length,
        checkInDate,
        checkOutDate,
        nights: diffDays,
        guests: totalGuests,
        roomCharges,
        servicesCharges,
        taxAmount,
        totalAmount,
        bookingStatus: 'Confirmed',
        paymentStatus: paymentResult.paymentStatus === 'Completed' ? 'Paid' : 'Pending',
        paymentMethod,
        paymentResult,
        receipt: paymentProcessor.getReceiptSummary(),
      },
    });
  } catch (err: any) {
    console.error('createBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete reservation. ' + err.message });
  }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { status, paymentStatus } = req.body;

    const existing = dbService.queryOne<any>('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    dbService.run(
      `UPDATE bookings SET
        booking_status = COALESCE(?, booking_status),
        payment_status = COALESCE(?, payment_status),
        updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = ?`,
      [status || null, paymentStatus || null, bookingId]
    );

    // Update physical room status accordingly for all rooms in the booking
    const brRows = dbService.query<any>('SELECT room_id FROM booking_rooms WHERE booking_id = ?', [bookingId]);
    for (const brRow of brRows) {
      if (status === 'Checked-In') {
        dbService.run("UPDATE rooms SET status = 'Occupied' WHERE room_id = ?", [brRow.room_id]);
      } else if (status === 'Checked-Out' || status === 'Cancelled') {
        dbService.run("UPDATE rooms SET status = 'Available' WHERE room_id = ?", [brRow.room_id]);
      }
    }

    res.json({ success: true, message: `Booking ${existing.booking_reference} status updated to ${status}` });
  } catch (err: any) {
    console.error('updateBookingStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const user = req.user;

    const booking = dbService.queryOne<any>('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (user && user.role === 'customer' && booking.customer_id !== user.userId) {
      res.status(403).json({ success: false, message: 'Cannot cancel another guest reservation' });
      return;
    }

    if (booking.booking_status === 'Cancelled') {
      res.status(400).json({ success: false, message: 'Booking is already cancelled' });
      return;
    }

    // Cancel in database and mark refunded if paid
    const newPaymentStatus = booking.payment_status === 'Paid' ? 'Refunded' : booking.payment_status;
    dbService.run(
      "UPDATE bookings SET booking_status = 'Cancelled', payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?",
      [newPaymentStatus, bookingId]
    );

    // Free all rooms in this booking back to Available
    const brRows = dbService.query<any>('SELECT room_id FROM booking_rooms WHERE booking_id = ?', [bookingId]);
    for (const br of brRows) {
      dbService.run("UPDATE rooms SET status = 'Available' WHERE room_id = ?", [br.room_id]);
    }

    res.json({
      success: true,
      message: `Booking ${booking.booking_reference} has been cancelled successfully.`,
    });
  } catch (err: any) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};
