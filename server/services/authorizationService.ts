/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbService } from './databaseService.js';
import { authenticationService } from './authenticationService.js';
import { User, Admin, Guest } from '../models/User.js';

export class AuthorizationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * ============================================================================
 * OOP CONCEPT: ENCAPSULATION IN AUTHORIZATION SERVICE (RBAC)
 * ============================================================================
 * `AuthorizationService` encapsulates all Role-Based Access Control rules:
 *   1. Uses the relational database (`users` joined with `roles`) as the single
 *      source of truth on every request—never trusting client-side state or
 *      unverified claims.
 *   2. Hydrates the appropriate polymorphic domain object (`Guest` or `Admin`)
 *      and checks `user.canAccessAdminPortal()` and `user.hasPermission(...)`.
 *   3. Why Guests Cannot Access Admin Functionality:
 *      Even if a Guest modifies frontend JavaScript, manually navigates to
 *      `/admin/dashboard`, or sends direct HTTP requests to `/api/rooms`,
 *      `/api/bookings/:id/status`, `/api/customers`, or `/api/reports/*`,
 *      `AuthorizationService.assertAdminRole()` queries the database for the
 *      authenticated `user_id`, sees `role = 'customer'` (`GUEST`), and
 *      immediately rejects the request with `403 Forbidden`.
 */
export class AuthorizationService {
  private static instance: AuthorizationService | null = null;

  private constructor() {}

  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * Queries the database (`users` + `roles`) as the single source of truth
   * and returns the encapsulated `Guest` or `Admin` instance.
   */
  public getUserFromDatabase(userId: number): Guest | Admin {
    const userRow = dbService.queryOne<any>(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (!userRow) {
      throw new AuthorizationError('Authenticated user account no longer exists.', 401);
    }

    return authenticationService.instantiateUserFromRow(userRow);
  }

  /**
   * Strictly verifies that the user exists in the database AND holds the
   * `ADMIN` role (`canAccessAdminPortal() === true`).
   * Throws a 403 Forbidden `AuthorizationError` if a Guest attempts access.
   */
  public assertAdminRole(userId?: number): Admin {
    if (!userId) {
      throw new AuthorizationError('Authentication required to access administrator resources.', 401);
    }

    const user = this.getUserFromDatabase(userId);

    if (!user.canAccessAdminPortal() || !(user instanceof Admin)) {
      throw new AuthorizationError(
        '403 Forbidden: Guest accounts are strictly prohibited from accessing Admin Portal resources.',
        403
      );
    }

    return user;
  }

  /**
   * Verifies that the user is authenticated in the database (Guest or Admin).
   */
  public assertAuthenticatedUser(userId?: number): User {
    if (!userId) {
      throw new AuthorizationError('Authentication required. Please log in.', 401);
    }
    return this.getUserFromDatabase(userId);
  }

  /**
   * Checks whether the database-verified user has a specific permission.
   */
  public assertPermission(userId: number, permission: string): User {
    const user = this.getUserFromDatabase(userId);
    if (!user.hasPermission(permission)) {
      throw new AuthorizationError(
        `403 Forbidden: Missing required permission '${permission}'.`,
        403
      );
    }
    return user;
  }
}

export const authorizationService = AuthorizationService.getInstance();
