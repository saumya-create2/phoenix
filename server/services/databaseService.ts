/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';
import { config } from '../config/database.js';

export interface QueryResultInfo {
  changes: number;
  lastInsertRowid: number;
}

/**
 * DatabaseService implements the Singleton pattern (OOPS)
 * Encapsulates SQL database connection, parameterized query execution,
 * transactions, and demo reset routines.
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const SQL = await initSqlJs();
      this.db = new SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON;');

      this.createTables();
      await this.seedInitialData();
      this.isInitialized = true;
      console.log('✅ StayEase Relational Database initialized and seeded successfully.');
    } catch (err) {
      console.error('❌ Failed to initialize DatabaseService:', err);
      throw err;
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      CREATE TABLE IF NOT EXISTS roles (
        role_id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT CHECK(role_name IN ('GUEST', 'ADMIN')) NOT NULL UNIQUE,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'customer')) NOT NULL DEFAULT 'customer',
        role_id INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS guests (
        guest_id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        id_proof_type TEXT DEFAULT 'Aadhaar / Passport',
        id_proof_number TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY,
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        id_proof_type TEXT DEFAULT 'Aadhaar / Passport',
        id_proof_number TEXT DEFAULT '',
        loyalty_points INTEGER DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS admins (
        admin_id INTEGER PRIMARY KEY,
        department TEXT DEFAULT 'Management',
        access_level TEXT CHECK(access_level IN ('super_admin', 'manager', 'receptionist')) DEFAULT 'manager',
        FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS room_types (
        room_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        base_price REAL NOT NULL CHECK (base_price >= 0),
        max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
        bed_type TEXT NOT NULL,
        size_sqft INTEGER NOT NULL DEFAULT 350,
        image_url TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        room_id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        room_type_id INTEGER NOT NULL,
        floor_number INTEGER NOT NULL DEFAULT 1,
        status TEXT CHECK(status IN ('Available', 'Reserved', 'Occupied', 'Maintenance')) NOT NULL DEFAULT 'Available',
        housekeeping_status TEXT CHECK(housekeeping_status IN ('Clean', 'Dirty', 'Cleaning in Progress', 'Inspected')) NOT NULL DEFAULT 'Clean',
        assigned_housekeeper TEXT DEFAULT 'Anita Verma',
        image_url TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS coupons (
        coupon_id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
        description TEXT NOT NULL,
        min_spend REAL NOT NULL DEFAULT 0.0,
        is_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS amenities (
        amenity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL DEFAULT 'Sparkles',
        category TEXT NOT NULL DEFAULT 'General'
      );

      CREATE TABLE IF NOT EXISTS room_type_amenities (
        room_type_id INTEGER NOT NULL,
        amenity_id INTEGER NOT NULL,
        PRIMARY KEY (room_type_id, amenity_id),
        FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE,
        FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS services (
        service_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price REAL NOT NULL CHECK (price >= 0),
        charge_type TEXT CHECK(charge_type IN ('per_booking', 'per_day', 'per_person')) NOT NULL DEFAULT 'per_booking',
        icon TEXT NOT NULL DEFAULT 'Coffee',
        is_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_reference TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        check_in_date TEXT NOT NULL,
        check_out_date TEXT NOT NULL,
        total_guests INTEGER NOT NULL CHECK (total_guests > 0),
        room_charges REAL NOT NULL DEFAULT 0.0,
        services_charges REAL NOT NULL DEFAULT 0.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        total_amount REAL NOT NULL DEFAULT 0.0,
        booking_status TEXT CHECK(booking_status IN ('Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled')) NOT NULL DEFAULT 'Pending',
        payment_status TEXT CHECK(payment_status IN ('Pending', 'Paid', 'Refunded', 'Failed')) NOT NULL DEFAULT 'Pending',
        coupon_code TEXT DEFAULT NULL,
        discount_amount REAL NOT NULL DEFAULT 0.0,
        payment_mode_selected TEXT DEFAULT 'full',
        special_requests TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS booking_rooms (
        booking_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        price_per_night REAL NOT NULL,
        nights INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        PRIMARY KEY (booking_id, room_id),
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS booking_services (
        booking_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        PRIMARY KEY (booking_id, service_id),
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS payments (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        transaction_reference TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL CHECK (amount > 0),
        payment_method TEXT CHECK(payment_method IN ('Cash at Hotel', 'Demo Card Payment', 'UPI', 'Net Banking')) NOT NULL,
        payment_status TEXT CHECK(payment_status IN ('Completed', 'Pending', 'Failed', 'Refunded')) NOT NULL DEFAULT 'Completed',
        card_last_four TEXT DEFAULT NULL,
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        room_type_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE
      );
    `;

    this.db.run(schema);
  }

  public async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Hash passwords dynamically (Plaintext passwords are never stored)
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const customerPassHash = await bcrypt.hash('Customer@123', 10);

    // Roles (Normalized RBAC Roles Table)
    this.run('INSERT INTO roles (role_id, role_name, description) VALUES (?, ?, ?)', [
      1,
      'GUEST',
      'Registered hotel guest with access to room booking and personal reservation history.',
    ]);
    this.run('INSERT INTO roles (role_id, role_name, description) VALUES (?, ?, ?)', [
      2,
      'ADMIN',
      'Hotel administrator with full access to room inventory, bookings, and management.',
    ]);

    // Users
    const users = [
      [1, 'Phoenix Administrator', 'admin@phoenixhotel.com', adminPassHash, '+91 98765 43210', 'admin', 2],
      [2, 'Aditya Mehta', 'guest@phoenixhotel.com', customerPassHash, '+91 98111 22233', 'customer', 1],
      [3, 'Priya Sharma', 'priya.sharma@example.com', customerPassHash, '+91 98222 33344', 'customer', 1],
      [4, 'Rajesh Patel', 'rajesh.patel@example.com', customerPassHash, '+91 98333 44455', 'customer', 1],
      [5, 'Sneha Reddy', 'sneha.reddy@example.com', customerPassHash, '+91 98444 55566', 'customer', 1],
      [6, 'Vikram Malhotra', 'vikram.m@example.com', customerPassHash, '+91 98555 66677', 'customer', 1],
      [7, 'Ananya Iyer', 'ananya.iyer@example.com', customerPassHash, '+91 98666 77788', 'customer', 1],
      [8, 'Rohan Kapoor', 'rohan.k@example.com', customerPassHash, '+91 98777 88899', 'customer', 1],
      [9, 'Kavita Deshmukh', 'kavita.d@example.com', customerPassHash, '+91 98888 99900', 'customer', 1],
      [10, 'Arjun Nambiar', 'arjun.n@example.com', customerPassHash, '+91 98999 00011', 'customer', 1],
      [11, 'Administrator StayEase', 'admin@stayease.com', adminPassHash, '+91 98765 43211', 'admin', 2],
      [12, 'Aditya Mehta', 'customer@stayease.com', customerPassHash, '+91 98111 22234', 'customer', 1],
    ];

    for (const u of users) {
      this.run('INSERT INTO users (user_id, name, email, password_hash, phone, role, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)', u);
    }

    // Admins
    this.run('INSERT INTO admins (admin_id, department, access_level) VALUES (?, ?, ?)', [1, 'General Operations', 'super_admin']);
    this.run('INSERT INTO admins (admin_id, department, access_level) VALUES (?, ?, ?)', [11, 'General Operations', 'super_admin']);

    // Customers & Guests
    const customers = [
      [2, 'Flat 402, Green Glen Layout, Bellandur', 'Bengaluru', 'Passport', 'Z1234567', 450],
      [3, '12-B Marine Lines, Nariman Point', 'Mumbai', 'Aadhaar Card', '9876-5432-1098', 120],
      [4, '78 Satellite Road, Bodakdev', 'Ahmedabad', 'Driving License', 'GJ01-2019-8877', 80],
      [5, 'Plot 45, Jubilee Hills', 'Hyderabad', 'Aadhaar Card', '4321-8765-2109', 240],
      [6, 'B-4 Civil Lines', 'New Delhi', 'Passport', 'M8976541', 500],
      [7, '15 Anna Nagar East', 'Chennai', 'Aadhaar Card', '6543-2109-8765', 90],
      [8, '22 Koregaon Park', 'Pune', 'Passport', 'P5432198', 310],
      [9, '9 South Extension Part 2', 'New Delhi', 'Aadhaar Card', '1122-3344-5566', 150],
      [10, '104 Panampilly Nagar', 'Kochi', 'Driving License', 'KL07-2021-3322', 75],
      [12, 'Flat 402, Green Glen Layout, Bellandur', 'Bengaluru', 'Passport', 'Z1234568', 450],
    ];

    for (const c of customers) {
      this.run('INSERT INTO customers (customer_id, address, city, id_proof_type, id_proof_number, loyalty_points) VALUES (?, ?, ?, ?, ?, ?)', c);
      this.run('INSERT INTO guests (guest_id, user_id, address, city, id_proof_type, id_proof_number) VALUES (?, ?, ?, ?, ?, ?)', [
        c[0],
        c[0],
        c[1],
        c[2],
        c[3],
        c[4],
      ]);
    }

    // Room Types (6 Core Hotel Categories)
    const roomTypes = [
      [
        1,
        'Standard Room',
        'STD',
        '1–2 guests • King or twin bed • Basic modern amenities & affordable pricing. Ideal for solo travelers and couples seeking comfort and value.',
        2500.0,
        2,
        'King or Twin Bed',
        320,
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      ],
      [
        2,
        'Deluxe Room',
        'DLX',
        '2–3 guests • King-size bed • Larger room with upgraded contemporary furnishings, seating lounge, and premium amenities.',
        4000.0,
        3,
        'King-Size Bed',
        450,
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      ],
      [
        3,
        'Executive Room',
        'EXEC',
        '2–3 guests • King-size bed • Spacious dedicated workspace and premium executive amenities.',
        5500.0,
        3,
        'King-Size Bed',
        540,
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      ],
      [
        4,
        'Family Room',
        'FAM',
        '3–5 guests • Multiple beds • Generous larger space designed for families with kids, dining nook, and family-friendly amenities.',
        6800.0,
        5,
        'Multiple Beds (2 Queen + 1 Twin)',
        700,
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      ],
      [
        5,
        'Suite',
        'STE',
        '2–4 guests • King-size bed • Separate master bedroom and private living area with bespoke luxury amenities and marble bath.',
        9500.0,
        4,
        'King-Size Bed',
        860,
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
      ],
      [
        6,
        'Presidential Suite',
        'PRES',
        '2–4 guests • King-size bed • Expansive master bedroom and grand living room with premium luxury furnishings and high-end amenities.',
        15000.0,
        4,
        'King-Size Bed',
        1350,
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      ],
    ];

    for (const rt of roomTypes) {
      this.run('INSERT INTO room_types (room_type_id, name, code, description, base_price, max_occupancy, bed_type, size_sqft, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', rt);
    }

    // Amenities
    const amenities = [
      [1, 'High-Speed Wi-Fi', 'Wifi', 'Connectivity'],
      [2, 'Dual-Zone Air Conditioning', 'AirVent', 'Climate'],
      [3, '55" Ultra HD Smart TV', 'Tv', 'Entertainment'],
      [5, 'Electronic In-Room Safe', 'ShieldCheck', 'Security'],
      [6, 'Marble En-Suite Jacuzzi', 'Bath', 'Luxury'],
      [8, 'Espresso & Herbal Tea Maker', 'Coffee', 'Dining'],
      [9, '24/7 Concierge & Room Service', 'Clock', 'Service'],
      [10, 'Spacious Executive Workspace', 'Laptop', 'Business'],
      [11, 'Separate Living Area', 'Layers', 'Space'],
    ];

    for (const a of amenities) {
      this.run('INSERT INTO amenities (amenity_id, name, icon, category) VALUES (?, ?, ?, ?)', a);
    }

    // Room Type Amenities (Mapped per category tier)
    const rta = [
      // 1. Standard Room: Basic modern amenities
      [1, 1], [1, 2], [1, 3], [1, 5], [1, 8],
      // 2. Deluxe Room: Larger room + premium amenities
      [2, 1], [2, 2], [2, 3], [2, 5], [2, 8], [2, 9],
      // 3. Executive Room: Spacious workspace + premium amenities
      [3, 1], [3, 2], [3, 3], [3, 5], [3, 8], [3, 9], [3, 10],
      // 4. Family Room: Larger space + family-friendly amenities
      [4, 1], [4, 2], [4, 3], [4, 5], [4, 8], [4, 9], [4, 11],
      // 5. Suite: Separate bedroom & living area + luxury amenities
      [5, 1], [5, 2], [5, 3], [5, 5], [5, 6], [5, 8], [5, 9], [5, 11],
      // 6. Presidential Suite: Large bedroom & living room + high-end luxury amenities
      [6, 1], [6, 2], [6, 3], [6, 5], [6, 6], [6, 8], [6, 9], [6, 10], [6, 11],
    ];

    for (const pair of rta) {
      this.run('INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)', pair);
    }

    // Rooms (24 physical rooms distributed across all 6 room categories)
    const rooms = [
      // Standard Rooms (Type 1)
      [1, '101', 1, 1, 'Available', 'Clean', 'Anita Verma', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', 'King bed • Quiet courtyard aspect'],
      [2, '102', 1, 1, 'Available', 'Inspected', 'Anita Verma', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80', 'Twin beds • Near elevator lobby'],
      [3, '103', 1, 1, 'Occupied', 'Cleaning in Progress', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', 'King bed • Guest checked in'],
      [4, '104', 1, 1, 'Available', 'Clean', 'Sunita Devi', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80', 'Twin beds • Garden walkway view'],
      // Deluxe Rooms (Type 2)
      [5, '105', 2, 1, 'Reserved', 'Clean', 'Anita Verma', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Deluxe lounge seating'],
      [6, '106', 2, 1, 'Available', 'Clean', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Poolside garden view'],
      [7, '201', 2, 2, 'Available', 'Inspected', 'Sunita Devi', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=900&q=80', 'King-size bed • Corner deluxe room'],
      [8, '202', 2, 2, 'Occupied', 'Dirty', 'Anita Verma', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Guest staying'],
      // Executive Rooms (Type 3)
      [9, '203', 3, 2, 'Available', 'Clean', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Ergo workstation & executive desk'],
      [10, '204', 3, 2, 'Available', 'Inspected', 'Sunita Devi', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Executive floor with lounge access'],
      [11, '205', 3, 2, 'Reserved', 'Clean', 'Anita Verma', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Spacious desk & panoramic glass'],
      [12, '301', 3, 3, 'Available', 'Clean', 'Sunita Devi', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'High-floor quiet executive wing'],
      // Family Rooms (Type 4)
      [13, '206', 4, 2, 'Available', 'Clean', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', '2 Queen + 1 Twin bed • Family dining nook'],
      [14, '302', 4, 3, 'Available', 'Inspected', 'Anita Verma', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Spacious family layout with kids area'],
      [15, '303', 4, 3, 'Occupied', 'Dirty', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Family vacation stay in progress'],
      [16, '304', 4, 3, 'Available', 'Clean', 'Sunita Devi', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Interconnected family suite space'],
      // Suites (Type 5)
      [17, '305', 5, 3, 'Maintenance', 'Cleaning in Progress', 'Anita Verma', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Separate living area • Scheduled servicing'],
      [18, '306', 5, 3, 'Available', 'Inspected', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Separate bedroom & living salon'],
      [19, '401', 5, 4, 'Available', 'Clean', 'Sunita Devi', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Luxury suite with private Jacuzzi'],
      [20, '402', 5, 4, 'Available', 'Inspected', 'Anita Verma', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Sunset terrace & living lounge'],
      // Presidential Suites (Type 6)
      [21, '403', 6, 4, 'Occupied', 'Dirty', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Presidential wing • Grand living & dining'],
      [22, '404', 6, 4, 'Available', 'Inspected', 'Sunita Devi', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Royal King bedroom + private dining lounge'],
      [23, '405', 6, 4, 'Available', 'Clean', 'Anita Verma', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Penthouse Presidential Suite • 360° vista'],
      [24, '406', 6, 4, 'Available', 'Inspected', 'Ramesh Kumar', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Ambassador Presidential Residence'],
    ];

    for (const r of rooms) {
      this.run('INSERT INTO rooms (room_id, room_number, room_type_id, floor_number, status, housekeeping_status, assigned_housekeeper, image_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', r);
    }

    // Seed QloApps Coupons
    const coupons = [
      [1, 'WELCOME10', 10, 'Welcome special 10% instant discount on direct booking', 2000.0],
      [2, 'QLODEAL15', 15, 'QloApps Seasonal Special 15% discount for luxury retreats', 3500.0],
      [3, 'STAYEASE20', 20, 'StayEase Festival special 20% discount on executive stays', 5000.0],
    ];

    for (const cp of coupons) {
      this.run('INSERT INTO coupons (coupon_id, code, discount_percent, description, min_spend) VALUES (?, ?, ?, ?, ?)', cp);
    }

    // Services
    const services = [
      [1, 'Gourmet Buffet Breakfast', 'Lavish continental and authentic Indian breakfast buffet prepared fresh by master chefs.', 450.0, 'per_day', 'Utensils'],
      [2, 'Luxury Airport Chauffeur', 'Private chauffeured sedan airport transfer with flight tracking and baggage handling.', 1200.0, 'per_booking', 'Car'],
      [3, 'Express Laundry & Dry Clean', 'Next-day professional steam pressing, wash, and delicate fabric care.', 350.0, 'per_booking', 'Shirt'],
      [4, 'Rejuvenating Ayurvedic Spa', '60-minute relaxing full-body aroma-oil massage and herbal foot reflexology.', 2500.0, 'per_person', 'Sparkles'],
      [5, 'Extra Rollaway Bed & Linens', 'Comfortable rollaway single mattress with luxury sheets, duvet, and pillows.', 800.0, 'per_day', 'Bed'],
    ];

    for (const s of services) {
      this.run('INSERT INTO services (service_id, name, description, price, charge_type, icon) VALUES (?, ?, ?, ?, ?, ?)', s);
    }

    // Bookings
    const bookings = [
      [1, 'SE-2026-1001', 2, '2026-10-10', '2026-10-13', 2, 12000.0, 1650.0, 1638.0, 15288.0, 'Confirmed', 'Paid', 'High floor requested, quiet corner please.'],
      [2, 'SE-2026-1002', 3, '2026-10-02', '2026-10-05', 1, 7500.0, 450.0, 954.0, 8904.0, 'Checked-In', 'Paid', 'Late check-in around 9:00 PM.'],
      [3, 'SE-2026-1003', 4, '2026-10-15', '2026-10-18', 2, 16500.0, 1200.0, 2124.0, 19824.0, 'Confirmed', 'Paid', 'Need airport pickup at Terminal 2.'],
      [4, 'SE-2026-1004', 5, '2026-09-20', '2026-09-23', 4, 20400.0, 2900.0, 2796.0, 26096.0, 'Checked-Out', 'Paid', 'Family vacation with two kids.'],
      [5, 'SE-2026-1005', 6, '2026-10-01', '2026-10-04', 2, 45000.0, 2500.0, 5700.0, 53200.0, 'Checked-In', 'Paid', 'VIP stay in Presidential Suite.'],
      [6, 'SE-2026-1006', 7, '2026-10-25', '2026-10-27', 1, 5000.0, 0.0, 600.0, 5600.0, 'Pending', 'Pending', 'Will pay cash at reception.'],
      [7, 'SE-2026-1007', 8, '2026-09-10', '2026-09-12', 2, 8000.0, 900.0, 1068.0, 9968.0, 'Checked-Out', 'Paid', 'Attending medical conference.'],
      [8, 'SE-2026-1008', 9, '2026-11-05', '2026-11-08', 3, 16500.0, 2500.0, 2280.0, 21280.0, 'Confirmed', 'Paid', 'Spa appointments on second day.'],
      [9, 'SE-2026-1009', 10, '2026-09-28', '2026-09-30', 2, 8000.0, 0.0, 960.0, 8960.0, 'Cancelled', 'Refunded', 'Trip cancelled due to sudden emergency.'],
      [10, 'SE-2026-1010', 2, '2026-11-15', '2026-11-18', 2, 28500.0, 0.0, 3420.0, 31920.0, 'Confirmed', 'Paid', 'Anniversary stay in Suite.'],
    ];

    for (const b of bookings) {
      this.run('INSERT INTO bookings (booking_id, booking_reference, customer_id, check_in_date, check_out_date, total_guests, room_charges, services_charges, tax_amount, total_amount, booking_status, payment_status, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', b);
    }

    // Booking Rooms
    const bookingRooms = [
      [1, 5, 4000.0, 3, 12000.0],
      [2, 3, 2500.0, 3, 7500.0],
      [3, 11, 5500.0, 3, 16500.0],
      [4, 15, 6800.0, 3, 20400.0],
      [5, 21, 15000.0, 3, 45000.0],
      [6, 4, 2500.0, 2, 5000.0],
      [7, 8, 4000.0, 2, 8000.0],
      [8, 12, 5500.0, 3, 16500.0],
      [9, 7, 4000.0, 2, 8000.0],
      [10, 20, 9500.0, 3, 28500.0],
    ];

    for (const br of bookingRooms) {
      this.run('INSERT INTO booking_rooms (booking_id, room_id, price_per_night, nights, subtotal) VALUES (?, ?, ?, ?, ?)', br);
    }

    // Booking Services
    const bookingServices = [
      [1, 1, 1, 450.0, 450.0],
      [1, 2, 1, 1200.0, 1200.0],
      [2, 1, 1, 450.0, 450.0],
      [3, 2, 1, 1200.0, 1200.0],
      [4, 1, 2, 450.0, 900.0],
      [4, 5, 1, 800.0, 800.0],
      [4, 2, 1, 1200.0, 1200.0],
      [5, 4, 1, 2500.0, 2500.0],
      [7, 1, 2, 450.0, 900.0],
      [8, 4, 1, 2500.0, 2500.0],
    ];

    for (const bs of bookingServices) {
      this.run('INSERT INTO booking_services (booking_id, service_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)', bs);
    }

    // Payments
    const payments = [
      [1, 1, 'TXN-CARD-9921', 15288.0, 'Demo Card Payment', 'Completed', '4242', '2026-10-01 14:22:10'],
      [2, 2, 'TXN-CASH-1002', 8904.0, 'Cash at Hotel', 'Completed', null, '2026-10-02 18:45:00'],
      [3, 3, 'TXN-CARD-8832', 19824.0, 'Demo Card Payment', 'Completed', '8812', '2026-10-02 11:30:15'],
      [4, 4, 'TXN-CARD-7741', 26096.0, 'Demo Card Payment', 'Completed', '1109', '2026-09-18 09:12:44'],
      [5, 5, 'TXN-CARD-6650', 53200.0, 'Demo Card Payment', 'Completed', '5523', '2026-09-30 16:50:20'],
      [6, 7, 'TXN-CASH-1007', 9968.0, 'Cash at Hotel', 'Completed', null, '2026-09-10 12:05:00'],
      [7, 8, 'TXN-CARD-5542', 21280.0, 'Demo Card Payment', 'Completed', '9012', '2026-10-01 20:10:00'],
      [8, 9, 'TXN-REFUND-909', 8960.0, 'Demo Card Payment', 'Refunded', '3341', '2026-09-29 10:00:00'],
      [9, 10, 'TXN-CARD-4431', 31920.0, 'Demo Card Payment', 'Completed', '4242', '2026-10-02 19:40:00'],
    ];

    for (const p of payments) {
      this.run('INSERT INTO payments (payment_id, booking_id, transaction_reference, amount, payment_method, payment_status, card_last_four, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);
    }

    // Reviews
    const reviews = [
      [1, 2, 2, 5, 'Exceptional experience! The Deluxe Room was spacious with upgraded furnishings, and the breakfast spread was five-star.', 'Aditya Mehta'],
      [2, 6, 6, 5, 'The Presidential Suite exceeded all expectations. Expansive living room, private butler service, and luxury furnishings made our stay unforgettable.', 'Vikram Malhotra'],
      [3, 4, 3, 5, 'Executive Room was ideal for my business trip. Spacious workspace, fast Wi-Fi, and panoramic views.', 'Rajesh Patel'],
      [4, 5, 4, 5, 'Family Room gave our kids plenty of space with multiple comfortable beds. The airport chauffeur pickup was seamless.', 'Sneha Reddy'],
      [5, 8, 5, 5, 'The Suite with a separate living area and marble jacuzzi was pure luxury. Will definitely return!', 'Rohan Kapoor'],
    ];

    for (const rev of reviews) {
      this.run('INSERT INTO reviews (review_id, customer_id, room_type_id, rating, comment, guest_name) VALUES (?, ?, ?, ?, ?, ?)', rev);
    }
  }

  public async resetDemoData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(`
      DELETE FROM reviews;
      DELETE FROM payments;
      DELETE FROM booking_services;
      DELETE FROM booking_rooms;
      DELETE FROM bookings;
      DELETE FROM services;
      DELETE FROM room_type_amenities;
      DELETE FROM amenities;
      DELETE FROM rooms;
      DELETE FROM room_types;
      DELETE FROM admins;
      DELETE FROM guests;
      DELETE FROM customers;
      DELETE FROM users;
      DELETE FROM roles;
    `);
    await this.seedInitialData();
  }

  /**
   * Run a SQL query with parameter binding and return parsed rows
   */
  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }

      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as unknown as T;
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (err: any) {
      console.error('SQL Query Error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const rows = this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Run a SQL INSERT, UPDATE, or DELETE query with parameter binding
   */
  public run(sql: string, params: any[] = []): QueryResultInfo {
    if (!this.db) throw new Error('Database not initialized');

    try {
      if (params && params.length > 0) {
        const stmt = this.db.prepare(sql);
        stmt.run(params);
        stmt.free();
      } else {
        this.db.run(sql);
      }

      // Fetch last insert row id and changes
      const idRes = this.db.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
      let lastInsertRowid = 0;
      let changes = 0;

      if (idRes.length > 0 && idRes[0].values.length > 0) {
        lastInsertRowid = Number(idRes[0].values[0][0]) || 0;
        changes = Number(idRes[0].values[0][1]) || 0;
      }

      return { lastInsertRowid, changes };
    } catch (err: any) {
      console.error('SQL Execute Error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  }
}

export const dbService = DatabaseService.getInstance();
