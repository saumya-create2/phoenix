/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getRoomTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roomTypes = dbService.query<any>(`
      SELECT 
        rt.*,
        COUNT(r.room_id) AS total_rooms,
        SUM(CASE WHEN r.status = 'Available' THEN 1 ELSE 0 END) AS available_rooms
      FROM room_types rt
      LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id
      GROUP BY rt.room_type_id
      ORDER BY rt.base_price ASC
    `);

    // Fetch all amenities
    const rtaList = dbService.query<any>(`
      SELECT rta.room_type_id, a.amenity_id, a.name, a.icon, a.category
      FROM room_type_amenities rta
      INNER JOIN amenities a ON rta.amenity_id = a.amenity_id
    `);

    const amenitiesMap = new Map<number, any[]>();
    for (const item of rtaList) {
      if (!amenitiesMap.has(item.room_type_id)) {
        amenitiesMap.set(item.room_type_id, []);
      }
      amenitiesMap.get(item.room_type_id)!.push({
        amenityId: item.amenity_id,
        name: item.name,
        icon: item.icon,
        category: item.category,
      });
    }

    const formatted = roomTypes.map((rt) => ({
      roomTypeId: rt.room_type_id,
      name: rt.name,
      code: rt.code,
      description: rt.description,
      basePrice: rt.base_price,
      maxOccupancy: rt.max_occupancy,
      bedType: rt.bed_type,
      sizeSqft: rt.size_sqft,
      imageUrl: rt.image_url,
      isActive: Boolean(rt.is_active),
      totalRooms: rt.total_rooms || 0,
      availableRooms: rt.available_rooms || 0,
      amenities: amenitiesMap.get(rt.room_type_id) || [],
    }));

    res.json({ success: true, count: formatted.length, roomTypes: formatted });
  } catch (err: any) {
    console.error('getRoomTypes error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve room types' });
  }
};

export const createRoomType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description, basePrice, maxOccupancy, bedType, sizeSqft, imageUrl, amenityIds } = req.body;

    if (!name || !code || !basePrice || !maxOccupancy || !bedType) {
      res.status(400).json({ success: false, message: 'Please provide all mandatory room type fields.' });
      return;
    }

    const insertRes = dbService.run(
      `INSERT INTO room_types (name, code, description, base_price, max_occupancy, bed_type, size_sqft, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        description || '',
        basePrice,
        maxOccupancy,
        bedType,
        sizeSqft || 350,
        imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      ]
    );

    const roomTypeId = insertRes.lastInsertRowid;

    if (Array.isArray(amenityIds) && amenityIds.length > 0) {
      for (const aId of amenityIds) {
        dbService.run('INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)', [roomTypeId, aId]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Room type created successfully',
      roomTypeId,
    });
  } catch (err: any) {
    console.error('createRoomType error:', err);
    res.status(500).json({ success: false, message: 'Failed to create room type' });
  }
};

export const updateRoomType = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypeId = parseInt(req.params.id, 10);
    const { name, code, description, basePrice, maxOccupancy, bedType, sizeSqft, imageUrl, amenityIds } = req.body;

    dbService.run(
      `UPDATE room_types SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        base_price = COALESCE(?, base_price),
        max_occupancy = COALESCE(?, max_occupancy),
        bed_type = COALESCE(?, bed_type),
        size_sqft = COALESCE(?, size_sqft),
        image_url = COALESCE(?, image_url)
       WHERE room_type_id = ?`,
      [name, code, description, basePrice, maxOccupancy, bedType, sizeSqft, imageUrl, roomTypeId]
    );

    if (Array.isArray(amenityIds)) {
      dbService.run('DELETE FROM room_type_amenities WHERE room_type_id = ?', [roomTypeId]);
      for (const aId of amenityIds) {
        dbService.run('INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)', [roomTypeId, aId]);
      }
    }

    res.json({ success: true, message: 'Room type updated successfully' });
  } catch (err: any) {
    console.error('updateRoomType error:', err);
    res.status(500).json({ success: false, message: 'Failed to update room type' });
  }
};

export const deleteRoomType = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypeId = parseInt(req.params.id, 10);

    const roomCheck = dbService.queryOne('SELECT room_id FROM rooms WHERE room_type_id = ?', [roomTypeId]);
    if (roomCheck) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete room type that has associated rooms. Please reassign or delete rooms first.',
      });
      return;
    }

    dbService.run('DELETE FROM room_type_amenities WHERE room_type_id = ?', [roomTypeId]);
    dbService.run('DELETE FROM room_types WHERE room_type_id = ?', [roomTypeId]);

    res.json({ success: true, message: 'Room type deleted successfully' });
  } catch (err: any) {
    console.error('deleteRoomType error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete room type' });
  }
};
