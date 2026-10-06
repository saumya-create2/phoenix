/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { dbService } from '../services/databaseService.js';
import {
  authenticationService,
  AuthenticationError,
} from '../services/authenticationService.js';
import {
  authorizationService,
  AuthorizationError,
} from '../services/authorizationService.js';

/**
 * POST /api/auth/register
 * Guest Portal Registration.
 * Encapsulated inside `AuthenticationService.registerGuest()` which always
 * assigns the `GUEST` (`customer`) role and hashes the password with bcrypt.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, address, city } = req.body;
    const result = await authenticationService.registerGuest({
      name,
      email,
      phone,
      password,
      address,
      city,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Phoenix Hotel & Suites.',
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    const status = err instanceof AuthenticationError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal server error during registration.',
    });
  }
};

/**
 * POST /api/auth/login
 * Guest Portal Authentication (`/login`).
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authenticationService.loginGuest(email, password);

    res.json({
      success: true,
      message: 'Guest sign-in successful.',
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    const status = err instanceof AuthenticationError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Invalid email or password.',
    });
  }
};

/**
 * POST /api/auth/admin/login
 * Dedicated Admin Portal Authentication (`/admin/login`).
 * Strictly verifies the `ADMIN` role in the database. If a Guest attempts to
 * log in with valid guest credentials, returns 403 Forbidden.
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authenticationService.loginAdmin(email, password);

    res.json({
      success: true,
      message: 'Administrator authentication verified.',
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    const status = err instanceof AuthenticationError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Invalid administrator credentials.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Invalidates the active JWT session token on the backend.
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  authenticationService.revokeToken(token);
  res.json({
    success: true,
    message: 'Session logged out successfully.',
  });
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile hydrated from the relational database.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const userModel = authorizationService.getUserFromDatabase(req.user.userId);
    res.json({
      success: true,
      user: userModel.toJSON(),
    });
  } catch (err: any) {
    const status = err instanceof AuthorizationError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Failed to retrieve user profile.',
    });
  }
};

/**
 * PUT /api/auth/profile
 * Allows an authenticated Guest to update their contact profile (name, phone, address, city).
 * ENCAPSULATION: User role cannot be modified through this endpoint.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { name, phone, address = '', city = '' } = req.body;
    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone number are required.' });
      return;
    }

    dbService.run(
      'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [name.trim(), phone.trim(), req.user.userId]
    );

    dbService.run(
      'UPDATE customers SET address = ?, city = ? WHERE customer_id = ?',
      [address.trim(), city.trim(), req.user.userId]
    );

    dbService.run(
      'UPDATE guests SET address = ?, city = ? WHERE user_id = ?',
      [address.trim(), city.trim(), req.user.userId]
    );

    const updatedUser = authorizationService.getUserFromDatabase(req.user.userId);
    res.json({
      success: true,
      message: 'Guest profile updated successfully.',
      user: updatedUser.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update profile.',
    });
  }
};

/**
 * GET /api/auth/admin/verify
 * Backend verification endpoint for the Admin Portal route guard.
 * Ensures that manually entering `/admin/dashboard` or modifying client state
 * is verified against the database `ADMIN` role.
 */
export const verifyAdminSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminModel = authorizationService.assertAdminRole(req.user?.userId);
    res.json({
      success: true,
      authorized: true,
      user: adminModel.toJSON(),
    });
  } catch (err: any) {
    const status = err instanceof AuthorizationError ? err.statusCode : 403;
    res.status(status).json({
      success: false,
      authorized: false,
      message: err.message || '403 Forbidden: Administrator role required.',
    });
  }
};
