/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * OOP DEMONSTRATION: ENCAPSULATION, ABSTRACTION, INHERITANCE, & POLYMORPHISM
 * ============================================================================
 *
 * 1. ENCAPSULATION:
 *    - Sensitive fields (`_passwordHash`, `_role`) are declared `private` inside
 *      the `User` class so neither external callers, frontend payloads, nor
 *      child classes can directly read or mutate them after instantiation.
 *    - Profile fields (`_userId`, `_name`, `_email`, `_phone`) are `protected`
 *      and exposed only through controlled getters/setters with validation.
 *    - `toJSON()` intentionally omits `_passwordHash` so password hashes can
 *      never leak in API responses.
 *
 * 2. WHY GUESTS CANNOT ACCESS ADMIN FUNCTIONALITY:
 *    - A `Guest` instance is constructed with `_role = 'customer'` (`GUEST`)
 *      and its polymorphic `canAccessAdminPortal()` always returns `false`.
 *    - Role assignment happens strictly on the backend from the database
 *      (`users` + `roles` tables). The frontend cannot mutate `_role`.
 *    - Every admin endpoint invokes `AuthorizationService.assertAdminRole()`,
 *      which re-queries the database and verifies `user.canAccessAdminPortal()`.
 */
export abstract class User {
  protected _userId: number;
  protected _name: string;
  protected _email: string;
  protected _phone: string;
  private readonly _role: 'admin' | 'customer';
  private _passwordHash: string;
  protected _createdAt: string;

  constructor(
    userId: number,
    name: string,
    email: string,
    phone: string,
    role: 'admin' | 'customer',
    createdAt: string = new Date().toISOString(),
    passwordHash: string = ''
  ) {
    this._userId = userId;
    this._name = name.trim();
    this._email = email.trim().toLowerCase();
    this._phone = phone.trim();
    this._role = role;
    this._createdAt = createdAt;
    this._passwordHash = passwordHash;
  }

  // Controlled Read-Only Getters (Encapsulation)
  public get userId(): number {
    return this._userId;
  }

  public get name(): string {
    return this._name;
  }

  public set name(newName: string) {
    if (!newName || newName.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long.');
    }
    this._name = newName.trim();
  }

  public get email(): string {
    return this._email;
  }

  public get phone(): string {
    return this._phone;
  }

  public set phone(newPhone: string) {
    if (!newPhone || newPhone.trim().length < 5) {
      throw new Error('Valid phone number is required.');
    }
    this._phone = newPhone.trim();
  }

  /**
   * Role getter is strictly read-only. No setter exists for `_role`,
   * preventing privilege escalation after object creation.
   */
  public get role(): 'admin' | 'customer' {
    return this._role;
  }

  public get roleCode(): 'ADMIN' | 'GUEST' {
    return this._role === 'admin' ? 'ADMIN' : 'GUEST';
  }

  public get createdAt(): string {
    return this._createdAt;
  }

  /**
   * Encapsulated password verification: compares a plaintext candidate
   * against the private `_passwordHash` without ever exposing the hash.
   */
  public async verifyPassword(plainTextPassword: string): Promise<boolean> {
    if (!this._passwordHash || !plainTextPassword) {
      return false;
    }
    return bcrypt.compare(plainTextPassword, this._passwordHash);
  }

  // Abstract Methods (Abstraction & Polymorphism)
  public abstract getDashboardUrl(): string;
  public abstract getPermissions(): string[];
  public abstract canAccessAdminPortal(): boolean;

  public hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  /**
   * Serializes safe public user properties.
   * Notice `_passwordHash` is strictly excluded (Encapsulation).
   */
  public toJSON() {
    return {
      userId: this._userId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      role: this._role,
      roleCode: this.getRoleCodeLabel(),
      permissions: this.getPermissions(),
      dashboardUrl: this.getDashboardUrl(),
      createdAt: this._createdAt,
    };
  }

  private getRoleCodeLabel(): 'ADMIN' | 'GUEST' {
    return this._role === 'admin' ? 'ADMIN' : 'GUEST';
  }
}

/**
 * ============================================================================
 * OOP CONCEPT: INHERITANCE & POLYMORPHISM
 * Subclass: Guest (also exported as Customer) extending User
 * ============================================================================
 * Encapsulates guest-specific attributes (`_address`, `_city`) and restricts
 * permissions strictly to guest portal operations.
 */
export class Guest extends User {
  private _address: string;
  private _city: string;
  private _loyaltyPoints: number;

  constructor(
    userId: number,
    name: string,
    email: string,
    phone: string,
    address: string = '',
    city: string = '',
    loyaltyPoints: number = 0,
    createdAt?: string,
    passwordHash: string = ''
  ) {
    super(userId, name, email, phone, 'customer', createdAt, passwordHash);
    this._address = address;
    this._city = city;
    this._loyaltyPoints = loyaltyPoints;
  }

  public get address(): string {
    return this._address;
  }

  public set address(value: string) {
    this._address = value.trim();
  }

  public get city(): string {
    return this._city;
  }

  public set city(value: string) {
    this._city = value.trim();
  }

  public get loyaltyPoints(): number {
    return this._loyaltyPoints;
  }

  public addLoyaltyPoints(points: number): void {
    if (points > 0) {
      this._loyaltyPoints += points;
    }
  }

  // Polymorphic implementation: Guests are routed to the Guest Bookings Portal
  public override getDashboardUrl(): string {
    return '/customer/bookings';
  }

  // Polymorphic implementation: Guests only receive guest-level permissions
  public override getPermissions(): string[] {
    return [
      'view_rooms',
      'book_room',
      'view_my_bookings',
      'cancel_booking',
      'manage_own_profile',
      'add_review',
    ];
  }

  // Polymorphic security guard: Guests can NEVER access the Admin Portal
  public override canAccessAdminPortal(): boolean {
    return false;
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      address: this._address,
      city: this._city,
      loyaltyPoints: this._loyaltyPoints,
    };
  }
}

// Export alias for backward compatibility across modules
export { Guest as Customer };

/**
 * ============================================================================
 * OOP CONCEPT: INHERITANCE & POLYMORPHISM
 * Subclass: Admin extending User
 * ============================================================================
 * Encapsulates administrator attributes (`_department`, `_accessLevel`) and
 * grants administrative permissions verified on the backend.
 */
export class Admin extends User {
  private _department: string;
  private _accessLevel: 'super_admin' | 'manager' | 'receptionist';

  constructor(
    userId: number,
    name: string,
    email: string,
    phone: string,
    department: string = 'Management',
    accessLevel: 'super_admin' | 'manager' | 'receptionist' = 'manager',
    createdAt?: string,
    passwordHash: string = ''
  ) {
    super(userId, name, email, phone, 'admin', createdAt, passwordHash);
    this._department = department;
    this._accessLevel = accessLevel;
  }

  public get department(): string {
    return this._department;
  }

  public set department(dept: string) {
    if (dept && dept.trim()) {
      this._department = dept.trim();
    }
  }

  public get accessLevel(): 'super_admin' | 'manager' | 'receptionist' {
    return this._accessLevel;
  }

  // Polymorphic implementation: Admins are routed to the Admin Portal Dashboard
  public override getDashboardUrl(): string {
    return '/admin/dashboard';
  }

  // Polymorphic implementation: Full administrative permissions
  public override getPermissions(): string[] {
    return [
      'manage_rooms',
      'manage_room_types',
      'manage_bookings',
      'manage_customers',
      'manage_services',
      'view_payments',
      'view_reports',
      'system_settings',
    ];
  }

  // Polymorphic security guard: Only Admin instances return true
  public override canAccessAdminPortal(): boolean {
    return true;
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      department: this._department,
      accessLevel: this._accessLevel,
    };
  }
}
