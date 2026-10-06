/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { authenticationService, AuthenticationError } from '../services/authenticationService.js';
import { authorizationService, AuthorizationError } from '../services/authorizationService.js';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  roleCode?: 'ADMIN' | 'GUEST';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

/**
 * Middleware: Verifies JWT Bearer token and confirms user still exists in the database.
 * Uses `AuthenticationService` and `AuthorizationService` (Encapsulation).
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.',
    });
    return;
  }

  try {
    const decoded = authenticationService.verifyToken(token);
    // Independently verify user identity and role from the relational database
    const dbUser = authorizationService.getUserFromDatabase(decoded.userId);

    req.token = token;
    req.user = {
      userId: dbUser.userId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      roleCode: dbUser.roleCode,
    };
    next();
  } catch (err: any) {
    const status = err instanceof AuthenticationError || err instanceof AuthorizationError ? err.statusCode : 401;
    res.status(status).json({
      success: false,
      message: err.message || 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Middleware: Attaches database-verified user if a valid token is present,
 * otherwise proceeds as an unauthenticated visitor.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = authenticationService.verifyToken(token);
      const dbUser = authorizationService.getUserFromDatabase(decoded.userId);
      req.token = token;
      req.user = {
        userId: dbUser.userId,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        roleCode: dbUser.roleCode,
      };
    } catch {
      // Ignore invalid token on optional routes
    }
  }
  next();
};

/**
 * Middleware: Strictly enforces Administrator role (`ADMIN`) on the backend.
 * Queries the database via `AuthorizationService.assertAdminRole()` on every
 * request so that a Guest can NEVER access admin endpoints even if they
 * manipulate frontend JavaScript or call the API directly.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required for Admin Portal access.',
      });
      return;
    }

    const adminUser = authorizationService.assertAdminRole(req.user.userId);
    req.user = {
      userId: adminUser.userId,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      roleCode: adminUser.roleCode,
    };
    next();
  } catch (err: any) {
    const status = err instanceof AuthorizationError ? err.statusCode : 403;
    res.status(status).json({
      success: false,
      message: err.message || '403 Forbidden: Administrator privileges required.',
    });
  }
};

export const requireCustomer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Access denied: Guest authentication required.',
    });
    return;
  }
  next();
};
