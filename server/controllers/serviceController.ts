/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';

export const getServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = dbService.query<any>(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY price ASC'
    );

    const formatted = services.map((s) => ({
      serviceId: s.service_id,
      name: s.name,
      description: s.description,
      price: s.price,
      chargeType: s.charge_type,
      icon: s.icon,
      isActive: Boolean(s.is_active),
    }));

    res.json({ success: true, count: formatted.length, services: formatted });
  } catch (err: any) {
    console.error('getServices error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve hotel services' });
  }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, chargeType = 'per_booking', icon = 'Coffee' } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ success: false, message: 'Service name and price are required' });
      return;
    }

    const insertRes = dbService.run(
      'INSERT INTO services (name, description, price, charge_type, icon) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), description || '', price, chargeType, icon]
    );

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      serviceId: insertRes.lastInsertRowid,
    });
  } catch (err: any) {
    console.error('createService error:', err);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { name, description, price, chargeType, icon, isActive } = req.body;

    dbService.run(
      `UPDATE services SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        charge_type = COALESCE(?, charge_type),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active)
       WHERE service_id = ?`,
      [name, description, price, chargeType, icon, isActive !== undefined ? (isActive ? 1 : 0) : null, serviceId]
    );

    res.json({ success: true, message: 'Service updated successfully' });
  } catch (err: any) {
    console.error('updateService error:', err);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    dbService.run('UPDATE services SET is_active = 0 WHERE service_id = ?', [serviceId]);
    res.json({ success: true, message: 'Service deactivated successfully' });
  } catch (err: any) {
    console.error('deleteService error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};
