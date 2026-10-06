/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      checkIn,
      checkOut,
      guests,
      roomTypeId,
      minPrice,
      maxPrice,
      status,
      availability,
      sortBy = 'price_asc',
    } = req.query;

    // Determine which rooms have date-overlap bookings for [checkIn, checkOut)
    const bookedRoomIds = new Set<number>();
    if (checkIn && checkOut) {
      const overlapping = dbService.query<{ room_id: number }>(
        `SELECT DISTINCT br.room_id
         FROM booking_rooms br
         INNER JOIN bookings b ON br.booking_id = b.booking_id
         WHERE b.booking_status NOT IN ('Cancelled', 'Checked-Out')
           AND b.check_in_date < ?
           AND b.check_out_date > ?`,
        [checkOut, checkIn]
      );
      for (const row of overlapping) {
        bookedRoomIds.add(row.room_id);
      }
    }

    // Calculate total rooms and available rooms per room_type_id
    const allPhysicalRooms = dbService.query<{ room_id: number; room_type_id: number; status: string }>(
      `SELECT room_id, room_type_id, status FROM rooms`
    );
    const typeCountsMap = new Map<number, { totalRooms: number; availableRooms: number }>();
    for (const r of allPhysicalRooms) {
      if (!typeCountsMap.has(r.room_type_id)) {
        typeCountsMap.set(r.room_type_id, { totalRooms: 0, availableRooms: 0 });
      }
      const entry = typeCountsMap.get(r.room_type_id)!;
      entry.totalRooms += 1;
      const isAvail = r.status === 'Available' && !bookedRoomIds.has(r.room_id);
      if (isAvail) {
        entry.availableRooms += 1;
      }
    }

    const params: any[] = [];
    let sql = `
      SELECT 
        r.room_id,
        r.room_number,
        r.room_type_id,
        r.floor_number,
        r.status AS physical_status,
        r.housekeeping_status,
        r.assigned_housekeeper,
        r.image_url AS room_image,
        r.notes,
        rt.name AS room_type_name,
        rt.code AS room_type_code,
        rt.description AS room_type_description,
        rt.base_price,
        rt.max_occupancy,
        rt.bed_type,
        rt.size_sqft,
        rt.image_url AS room_type_image
      FROM rooms r
      INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE 1=1
    `;

    // Admin filter for physical status
    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    // Room type category filter
    if (roomTypeId) {
      const rtid = parseInt(roomTypeId as string, 10);
      if (!isNaN(rtid)) {
        sql += ` AND r.room_type_id = ?`;
        params.push(rtid);
      }
    }

    // Price range filters
    if (minPrice) {
      const minP = parseFloat(minPrice as string);
      if (!isNaN(minP)) {
        sql += ` AND rt.base_price >= ?`;
        params.push(minP);
      }
    }

    if (maxPrice) {
      const maxP = parseFloat(maxPrice as string);
      if (!isNaN(maxP)) {
        sql += ` AND rt.base_price <= ?`;
        params.push(maxP);
      }
    }

    // Date-overlap filter when availability is not explicitly 'all' or 'unavailable'
    if (checkIn && checkOut && availability !== 'all' && availability !== 'unavailable') {
      sql += `
        AND r.status != 'Maintenance'
        AND r.room_id NOT IN (
          SELECT br.room_id
          FROM booking_rooms br
          INNER JOIN bookings b ON br.booking_id = b.booking_id
          WHERE b.booking_status NOT IN ('Cancelled')
            AND b.check_in_date < ?
            AND b.check_out_date > ?
        )
      `;
      params.push(checkOut, checkIn);
    }

    // Sorting
    switch (sortBy) {
      case 'price_desc':
        sql += ` ORDER BY rt.base_price DESC, r.room_number ASC`;
        break;
      case 'capacity':
      case 'occupancy_desc':
        sql += ` ORDER BY rt.max_occupancy DESC, rt.base_price ASC`;
        break;
      case 'occupancy_asc':
        sql += ` ORDER BY rt.max_occupancy ASC, rt.base_price ASC`;
        break;
      case 'room_type':
        sql += ` ORDER BY rt.room_type_id ASC, r.room_number ASC`;
        break;
      case 'room_number':
        sql += ` ORDER BY r.room_number ASC`;
        break;
      case 'price_asc':
      default:
        sql += ` ORDER BY rt.base_price ASC, r.room_number ASC`;
        break;
    }

    const rooms = dbService.query<any>(sql, params);

    // Fetch amenities for room types in one query
    const amenities = dbService.query<any>(`
      SELECT rta.room_type_id, a.amenity_id, a.name, a.icon, a.category
      FROM room_type_amenities rta
      INNER JOIN amenities a ON rta.amenity_id = a.amenity_id
    `);

    const amenitiesMap = new Map<number, any[]>();
    for (const am of amenities) {
      if (!amenitiesMap.has(am.room_type_id)) {
        amenitiesMap.set(am.room_type_id, []);
      }
      amenitiesMap.get(am.room_type_id)!.push({
        amenityId: am.amenity_id,
        name: am.name,
        icon: am.icon,
        category: am.category,
      });
    }

    let formattedRooms = rooms.map((room) => {
      const isBooked = bookedRoomIds.has(room.room_id);
      const isAvailableForQuery = room.physical_status === 'Available' && !isBooked;
      const effectiveStatus = isBooked && room.physical_status === 'Available' ? 'Reserved' : room.physical_status;
      const counts = typeCountsMap.get(room.room_type_id) || { totalRooms: 0, availableRooms: 0 };

      return {
        roomId: room.room_id,
        roomNumber: room.room_number,
        roomTypeId: room.room_type_id,
        floorNumber: room.floor_number,
        physicalStatus: effectiveStatus,
        housekeepingStatus: room.housekeeping_status || 'Clean',
        assignedHousekeeper: room.assigned_housekeeper || 'Staff',
        isAvailableForQuery,
        imageUrl: room.room_image || room.room_type_image,
        notes: room.notes,
        roomType: {
          roomTypeId: room.room_type_id,
          name: room.room_type_name,
          code: room.room_type_code,
          description: room.room_type_description,
          basePrice: room.base_price,
          maxOccupancy: room.max_occupancy,
          bedType: room.bed_type,
          sizeSqft: room.size_sqft,
          imageUrl: room.room_type_image,
          totalRooms: counts.totalRooms,
          availableRooms: counts.availableRooms,
          amenities: amenitiesMap.get(room.room_type_id) || [],
        },
      };
    });

    // Apply explicit availability status filter if requested
    if (availability === 'available') {
      formattedRooms = formattedRooms.filter((r) => r.isAvailableForQuery);
    } else if (availability === 'unavailable') {
      formattedRooms = formattedRooms.filter((r) => !r.isAvailableForQuery);
    }

    // Apply availability sorting if requested
    if (sortBy === 'availability') {
      formattedRooms.sort((a, b) => {
        if (a.isAvailableForQuery !== b.isAvailableForQuery) {
          return a.isAvailableForQuery ? -1 : 1;
        }
        if ((b.roomType.availableRooms || 0) !== (a.roomType.availableRooms || 0)) {
          return (b.roomType.availableRooms || 0) - (a.roomType.availableRooms || 0);
        }
        return a.roomType.basePrice - b.roomType.basePrice;
      });
    }

    res.json({
      success: true,
      count: formattedRooms.length,
      rooms: formattedRooms,
      filters: { checkIn, checkOut, guests, roomTypeId, minPrice, maxPrice, availability, sortBy },
    });
  } catch (err: any) {
    console.error('getRooms error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve rooms' });
  }
};

export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      res.status(400).json({ success: false, message: 'Invalid room ID' });
      return;
    }

    const room = dbService.queryOne<any>(
      `SELECT 
        r.room_id,
        r.room_number,
        r.room_type_id,
        r.floor_number,
        r.status AS physical_status,
        r.housekeeping_status,
        r.assigned_housekeeper,
        r.image_url AS room_image,
        r.notes,
        rt.name AS room_type_name,
        rt.code AS room_type_code,
        rt.description AS room_type_description,
        rt.base_price,
        rt.max_occupancy,
        rt.bed_type,
        rt.size_sqft,
        rt.image_url AS room_type_image
      FROM rooms r
      INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = ?`,
      [roomId]
    );

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    const rawAmenities = dbService.query<any>(
      `SELECT a.amenity_id, a.name, a.icon, a.category
       FROM room_type_amenities rta
       INNER JOIN amenities a ON rta.amenity_id = a.amenity_id
       WHERE rta.room_type_id = ?`,
      [room.room_type_id]
    );

    const amenities = rawAmenities.map((a) => ({
      amenityId: a.amenity_id,
      name: a.name,
      icon: a.icon,
      category: a.category,
    }));

    const countsRow = dbService.queryOne<any>(
      `SELECT 
        COUNT(room_id) AS total_rooms,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_rooms
       FROM rooms
       WHERE room_type_id = ?`,
      [room.room_type_id]
    );

    const reviews = dbService.query<any>(
      `SELECT review_id, customer_id, rating, comment, guest_name, created_at
       FROM reviews
       WHERE room_type_id = ?
       ORDER BY created_at DESC`,
      [room.room_type_id]
    );

    res.json({
      success: true,
      room: {
        roomId: room.room_id,
        roomNumber: room.room_number,
        roomTypeId: room.room_type_id,
        floorNumber: room.floor_number,
        physicalStatus: room.physical_status,
        housekeepingStatus: room.housekeeping_status || 'Clean',
        assignedHousekeeper: room.assigned_housekeeper || 'Staff',
        isAvailableForQuery: room.physical_status === 'Available',
        imageUrl: room.room_image || room.room_type_image,
        notes: room.notes,
        roomType: {
          roomTypeId: room.room_type_id,
          name: room.room_type_name,
          code: room.room_type_code,
          description: room.room_type_description,
          basePrice: room.base_price,
          maxOccupancy: room.max_occupancy,
          bedType: room.bed_type,
          sizeSqft: room.size_sqft,
          imageUrl: room.room_type_image,
          totalRooms: countsRow?.total_rooms || 0,
          availableRooms: countsRow?.available_rooms || 0,
          amenities,
        },
        reviews,
      },
    });
  } catch (err: any) {
    console.error('getRoomById error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve room details' });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, roomTypeId, floorNumber = 1, status = 'Available', imageUrl, notes } = req.body;

    if (!roomNumber || !roomTypeId) {
      res.status(400).json({ success: false, message: 'Room number and Room Type are required.' });
      return;
    }

    // Check unique room number
    const existing = dbService.queryOne('SELECT room_id FROM rooms WHERE room_number = ?', [roomNumber.trim()]);
    if (existing) {
      res.status(409).json({ success: false, message: `Room number ${roomNumber} already exists.` });
      return;
    }

    const insertRes = dbService.run(
      'INSERT INTO rooms (room_number, room_type_id, floor_number, status, image_url, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [roomNumber.trim(), roomTypeId, floorNumber, status, imageUrl || '', notes || '']
    );

    res.status(201).json({
      success: true,
      message: `Room ${roomNumber} created successfully.`,
      roomId: insertRes.lastInsertRowid,
    });
  } catch (err: any) {
    console.error('createRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id, 10);
    const { roomNumber, roomTypeId, floorNumber, status, imageUrl, notes } = req.body;

    const existing = dbService.queryOne('SELECT room_id FROM rooms WHERE room_id = ?', [roomId]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    if (roomNumber) {
      const conflict = dbService.queryOne('SELECT room_id FROM rooms WHERE room_number = ? AND room_id != ?', [roomNumber.trim(), roomId]);
      if (conflict) {
        res.status(409).json({ success: false, message: `Room number ${roomNumber} is already taken.` });
        return;
      }
    }

    dbService.run(
      `UPDATE rooms SET 
        room_number = COALESCE(?, room_number),
        room_type_id = COALESCE(?, room_type_id),
        floor_number = COALESCE(?, floor_number),
        status = COALESCE(?, status),
        image_url = COALESCE(?, image_url),
        notes = COALESCE(?, notes)
       WHERE room_id = ?`,
      [roomNumber || null, roomTypeId || null, floorNumber || null, status || null, imageUrl || null, notes || null, roomId]
    );

    res.json({ success: true, message: `Room ${roomId} updated successfully.` });
  } catch (err: any) {
    console.error('updateRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id, 10);

    // Check if room has active bookings
    const activeBooking = dbService.queryOne(
      `SELECT b.booking_id 
       FROM booking_rooms br
       INNER JOIN bookings b ON br.booking_id = b.booking_id
       WHERE br.room_id = ? AND b.booking_status IN ('Pending', 'Confirmed', 'Checked-In')`,
      [roomId]
    );

    if (activeBooking) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete room with active or upcoming reservations. Please cancel or reassign bookings first.',
      });
      return;
    }

    dbService.run('DELETE FROM booking_rooms WHERE room_id = ?', [roomId]);
    dbService.run('DELETE FROM rooms WHERE room_id = ?', [roomId]);

    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (err: any) {
    console.error('deleteRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
};

export const updateHousekeepingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id, 10);
    const { housekeepingStatus, assignedHousekeeper } = req.body;

    dbService.run(
      `UPDATE rooms SET
        housekeeping_status = COALESCE(?, housekeeping_status),
        assigned_housekeeper = COALESCE(?, assigned_housekeeper)
       WHERE room_id = ?`,
      [housekeepingStatus || null, assignedHousekeeper || null, roomId]
    );

    res.json({ success: true, message: `Room #${roomId} housekeeping status updated to ${housekeepingStatus}` });
  } catch (err: any) {
    console.error('updateHousekeepingStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update housekeeping status' });
  }
};

