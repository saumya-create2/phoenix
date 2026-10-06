/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from './databaseService.js';
import { config } from '../config/database.js';
import { User, Guest, Admin } from '../models/User.js';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  roleCode: 'ADMIN' | 'GUEST';
}

export interface AuthResult {
  token: string;
  user: ReturnType<User['toJSON']>;
}

export class AuthenticationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

/**
 * ============================================================================
 * OOP CONCEPT: ENCAPSULATION IN AUTHENTICATION SERVICE
 * ============================================================================
 * `AuthenticationService` encapsulates:
 *   1. Private cryptographic configuration (`_jwtSecret`, `_saltRounds`, `_tokenExpiry`).
 *   2. Private revoked token registry (`_revokedTokens`) for server-side logout invalidation.
 *   3. Password hashing (`hashPassword`) and encapsulated verification (`user.verifyPassword`).
 *   4. Role-isolated authentication workflows (`loginGuest` vs `loginAdmin`):
 *      - `registerGuest()` strictly assigns the `GUEST` (`customer`) role in the database,
 *        ignoring any `role` attribute that a malicious client might send in the request body.
 *      - `loginAdmin()` queries the database for the user's true role and throws a
 *        `403 Forbidden` AuthenticationError if a `GUEST` attempts to sign in through
 *        the Admin Portal (`/admin/login`).
 */
export class AuthenticationService {
  private static instance: AuthenticationService | null = null;

  private readonly _jwtSecret: string;
  private readonly _saltRounds: number = 10;
  private readonly _tokenExpiry: string = '7d';
  private readonly _revokedTokens: Set<string> = new Set();

  private constructor() {
    this._jwtSecret = config.jwtSecret;
  }

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * Private helper: hashes plaintext passwords using bcrypt.
   * Plaintext passwords are never stored in the database.
   */
  private async hashPassword(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, this._saltRounds);
  }

  /**
   * Private helper: generates a signed JWT containing user identity.
   * Note: Even with a valid JWT, `AuthorizationService` re-verifies the user's
   * role against the relational database on every protected admin request.
   */
  private issueToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      roleCode: user.roleCode,
    };
    return jwt.sign(payload, this._jwtSecret, { expiresIn: '7d' });
  }

  /**
   * Private helper: Hydrates a polymorphic `Guest` or `Admin` domain instance
   * from the relational database (`users` + `roles` + `guests`/`customers` or `admins`).
   */
  public instantiateUserFromRow(userRow: any): Guest | Admin {
    const dbRole = userRow.role === 'admin' || userRow.role_name === 'ADMIN' ? 'admin' : 'customer';

    if (dbRole === 'admin') {
      const adminRow = dbService.queryOne<any>(
        'SELECT * FROM admins WHERE admin_id = ?',
        [userRow.user_id]
      );
      return new Admin(
        userRow.user_id,
        userRow.name,
        userRow.email,
        userRow.phone,
        adminRow?.department || 'Management',
        adminRow?.access_level || 'manager',
        userRow.created_at,
        userRow.password_hash
      );
    }

    const custRow = dbService.queryOne<any>(
      'SELECT * FROM customers WHERE customer_id = ?',
      [userRow.user_id]
    );
    return new Guest(
      userRow.user_id,
      userRow.name,
      userRow.email,
      userRow.phone,
      custRow?.address || '',
      custRow?.city || '',
      custRow?.loyalty_points || 0,
      userRow.created_at,
      userRow.password_hash
    );
  }

  /**
   * Registers a new Guest account.
   * ENCAPSULATION SECURITY: Always enforces `role = 'customer'` (`role_id = 1` / `GUEST`)
   * in the database. The frontend cannot pass `role: 'admin'` to escalate privileges.
   */
  public async registerGuest(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
  }): Promise<AuthResult> {
    const { name, email, phone, password, address = '', city = '' } = input;

    if (!name || !email || !phone || !password) {
      throw new AuthenticationError(
        'All required fields (name, email, phone, password) must be provided.',
        400
      );
    }

    if (password.length < 6) {
      throw new AuthenticationError('Password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = dbService.queryOne(
      'SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)',
      [normalizedEmail]
    );
    if (existing) {
      throw new AuthenticationError('An account with this email address already exists.', 409);
    }

    const passwordHash = await this.hashPassword(password);

    // Resolve GUEST role_id from roles table
    const guestRoleRow = dbService.queryOne<{ role_id: number }>(
      "SELECT role_id FROM roles WHERE role_name = 'GUEST'"
    );
    const guestRoleId = guestRoleRow?.role_id || 1;

    const userInsert = dbService.run(
      'INSERT INTO users (name, email, password_hash, phone, role, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, phone.trim(), 'customer', guestRoleId]
    );

    const userId = userInsert.lastInsertRowid;

    // Insert into normalized guests and customers tables
    dbService.run(
      'INSERT INTO customers (customer_id, address, city, loyalty_points) VALUES (?, ?, ?, ?)',
      [userId, address.trim(), city.trim(), 0]
    );
    dbService.run(
      'INSERT INTO guests (guest_id, user_id, address, city) VALUES (?, ?, ?, ?)',
      [userId, userId, address.trim(), city.trim()]
    );

    const guestModel = new Guest(
      userId,
      name.trim(),
      normalizedEmail,
      phone.trim(),
      address.trim(),
      city.trim(),
      0,
      new Date().toISOString(),
      passwordHash
    );

    const token = this.issueToken(guestModel);
    return {
      token,
      user: guestModel.toJSON(),
    };
  }

  /**
   * Authenticates a Guest via the Guest Portal (`/login`).
   * Rejects Admin accounts on the guest login form so Guest and Admin portals
   * remain strictly separated.
   */
  public async loginGuest(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required.', 400);
    }

    const userRow = dbService.queryOne<any>(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (!userRow) {
      throw new AuthenticationError('Invalid email or password.', 401);
    }

    const userModel = this.instantiateUserFromRow(userRow);
    const isPasswordValid = await userModel.verifyPassword(password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password.', 401);
    }

    if (userModel.role === 'admin' || userModel.canAccessAdminPortal()) {
      throw new AuthenticationError(
        'Administrator accounts must sign in through the dedicated Admin Portal (/admin/login).',
        403
      );
    }

    const token = this.issueToken(userModel);
    return {
      token,
      user: userModel.toJSON(),
    };
  }

  /**
   * Authenticates an Administrator via the dedicated Admin Portal (`/admin/login`).
   * SECURITY TEST CASE #2:
   * A guest CANNOT log in through the admin login using guest credentials.
   * Even if the guest's email and password are valid, `userModel.canAccessAdminPortal()`
   * evaluates to `false`, returning 403 Forbidden.
   */
  public async loginAdmin(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw new AuthenticationError('Administrator email and password are required.', 400);
    }

    const userRow = dbService.queryOne<any>(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (!userRow) {
      throw new AuthenticationError('Invalid administrator credentials.', 401);
    }

    const userModel = this.instantiateUserFromRow(userRow);
    const isPasswordValid = await userModel.verifyPassword(password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid administrator credentials.', 401);
    }

    // Strict Role Verification (Encapsulated Polymorphic Check + DB Role Verification)
    if (!userModel.canAccessAdminPortal() || userModel.role !== 'admin') {
      throw new AuthenticationError(
        'Access Denied (403 Forbidden): Guest accounts are not authorized to access the Admin Portal.',
        403
      );
    }

    const token = this.issueToken(userModel);
    return {
      token,
      user: userModel.toJSON(),
    };
  }

  /**
   * Verifies a JWT token and checks that it has not been revoked via logout.
   */
  public verifyToken(token: string): AuthTokenPayload {
    if (!token) {
      throw new AuthenticationError('Authentication token is required.', 401);
    }

    if (this._revokedTokens.has(token)) {
      throw new AuthenticationError('Session token has been logged out. Please sign in again.', 401);
    }

    try {
      return jwt.verify(token, this._jwtSecret) as AuthTokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication token.', 401);
    }
  }

  /**
   * Invalidates a JWT token on logout.
   */
  public revokeToken(token?: string): void {
    if (token) {
      this._revokedTokens.add(token);
    }
  }
}

export const authenticationService = AuthenticationService.getInstance();
