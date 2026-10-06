-- ============================================================================
-- StayEase Hotel Management System - Relational Database Schema (3NF)
-- Designed for OOPS + RDBMS College Project
-- Dialect: MySQL 8.0+ / Relational SQL
-- ============================================================================

-- Create Database (for local MySQL installations)
CREATE DATABASE IF NOT EXISTS stayease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stayease_db;

-- ----------------------------------------------------------------------------
-- 0. ROLES TABLE (Normalized RBAC Roles: GUEST and ADMIN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('GUEST', 'ADMIN') NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Base entity for polymorphic User hierarchy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    role_id INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id)
        REFERENCES roles(role_id) ON DELETE RESTRICT,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. GUESTS & CUSTOMERS TABLES (Specialized guest attributes - 1:1 with users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guests (
    guest_id INT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    address VARCHAR(255) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    id_proof_type VARCHAR(50) DEFAULT 'Aadhaar / Passport',
    id_proof_number VARCHAR(100) DEFAULT '',
    CONSTRAINT fk_guest_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT PRIMARY KEY,
    address VARCHAR(255) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    id_proof_type VARCHAR(50) DEFAULT 'Aadhaar / Passport',
    id_proof_number VARCHAR(100) DEFAULT '',
    loyalty_points INT DEFAULT 0,
    CONSTRAINT fk_customer_user FOREIGN KEY (customer_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. ADMINS TABLE (Specialized admin attributes - 1:1 with users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT PRIMARY KEY,
    department VARCHAR(100) DEFAULT 'Management',
    access_level ENUM('super_admin', 'manager', 'receptionist') DEFAULT 'manager',
    CONSTRAINT fk_admin_user FOREIGN KEY (admin_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. ROOM TYPES TABLE (Master table for room categories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    max_occupancy INT NOT NULL CHECK (max_occupancy > 0),
    bed_type VARCHAR(50) NOT NULL,
    size_sqft INT NOT NULL DEFAULT 350,
    image_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. ROOMS TABLE (Physical hotel room instances)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    floor_number INT NOT NULL DEFAULT 1,
    status ENUM('Available', 'Reserved', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
    image_url VARCHAR(500) DEFAULT '',
    notes VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_type FOREIGN KEY (room_type_id) 
        REFERENCES room_types(room_type_id) ON DELETE RESTRICT,
    INDEX idx_room_status (status),
    INDEX idx_room_type (room_type_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. AMENITIES TABLE (Master table for features)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenities (
    amenity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL DEFAULT 'Sparkles',
    category VARCHAR(50) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. ROOM_AMENITIES TABLE (Junction table: M:N relationship Rooms/RoomTypes <-> Amenities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_type_amenities (
    room_type_id INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (room_type_id, amenity_id),
    CONSTRAINT fk_rta_room_type FOREIGN KEY (room_type_id) 
        REFERENCES room_types(room_type_id) ON DELETE CASCADE,
    CONSTRAINT fk_rta_amenity FOREIGN KEY (amenity_id) 
        REFERENCES amenities(amenity_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. HOTEL SERVICES TABLE (Add-on extra amenities/services for guests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    charge_type ENUM('per_booking', 'per_day', 'per_person') NOT NULL DEFAULT 'per_booking',
    icon VARCHAR(50) NOT NULL DEFAULT 'Coffee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. BOOKINGS TABLE (Header entity for reservations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(30) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_guests INT NOT NULL CHECK (total_guests > 0),
    room_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    services_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    booking_status ENUM('Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Pending', 'Paid', 'Refunded', 'Failed') NOT NULL DEFAULT 'Pending',
    special_requests TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date),
    INDEX idx_booking_dates (check_in_date, check_out_date),
    INDEX idx_booking_status (booking_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. BOOKING_ROOMS TABLE (Junction table: M:N Bookings <-> Rooms)
-- Prevents repeating groups and allows multiple rooms per booking if expanded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_rooms (
    booking_id INT NOT NULL,
    room_id INT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    nights INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (booking_id, room_id),
    CONSTRAINT fk_br_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_br_room FOREIGN KEY (room_id) 
        REFERENCES rooms(room_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. BOOKING_SERVICES TABLE (Junction table: M:N Bookings <-> Services)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_services (
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (booking_id, service_id),
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_service FOREIGN KEY (service_id) 
        REFERENCES services(service_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. PAYMENTS TABLE (Financial transaction logs - demonstrates Polymorphic Payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_reference VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method ENUM('Cash at Hotel', 'Demo Card Payment', 'UPI', 'Net Banking') NOT NULL,
    payment_status ENUM('Completed', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Completed',
    card_last_four VARCHAR(4) DEFAULT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. REVIEWS TABLE (Customer feedback linked to bookings & rooms)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    room_type_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_room_type FOREIGN KEY (room_type_id) 
        REFERENCES room_types(room_type_id) ON DELETE CASCADE
) ENGINE=InnoDB;
