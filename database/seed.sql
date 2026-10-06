-- ============================================================================
-- StayEase Hotel Management System - Comprehensive Seed Data
-- Passwords:
-- Admin:    Admin@123    (bcrypt: $2a$10$wK1W583x.rC6oM0R8y46p.ZfQJp2a6gR90Q583xrC6oM0R8y46p)
-- Customer: Customer@123 (bcrypt: $2a$10$wK1W583x.rC6oM0R8y46p.ZfQJp2a6gR90Q583xrC6oM0R8y46p)
-- ============================================================================

-- Clean up existing data in correct FK order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reviews;
TRUNCATE TABLE payments;
TRUNCATE TABLE booking_services;
TRUNCATE TABLE booking_rooms;
TRUNCATE TABLE bookings;
TRUNCATE TABLE services;
TRUNCATE TABLE room_type_amenities;
TRUNCATE TABLE amenities;
TRUNCATE TABLE rooms;
TRUNCATE TABLE room_types;
TRUNCATE TABLE admins;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ----------------------------------------------------------------------------
-- Password hash for 'Admin@123' and 'Customer@123' generated with bcrypt
-- Admin ID: 1
INSERT INTO users (user_id, name, email, password_hash, phone, role) VALUES
(1, 'Administrator StayEase', 'admin@stayease.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98765 43210', 'admin'),
(2, 'Aditya Mehta', 'customer@stayease.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98111 22233', 'customer'),
(3, 'Priya Sharma', 'priya.sharma@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98222 33344', 'customer'),
(4, 'Rajesh Patel', 'rajesh.patel@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98333 44455', 'customer'),
(5, 'Sneha Reddy', 'sneha.reddy@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98444 55566', 'customer'),
(6, 'Vikram Malhotra', 'vikram.m@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98555 66677', 'customer'),
(7, 'Ananya Iyer', 'ananya.iyer@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98666 77788', 'customer'),
(8, 'Rohan Kapoor', 'rohan.k@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98777 88899', 'customer'),
(9, 'Kavita Deshmukh', 'kavita.d@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98888 99900', 'customer'),
(10, 'Arjun Nambiar', 'arjun.n@example.com', '$2a$10$iGgQfPfqo66xPau456Z4b.X9d4Q8W8r9G5oE6BwQ0rA0u0K6s0vS2', '+91 98999 00011', 'customer');

INSERT INTO admins (admin_id, department, access_level) VALUES
(1, 'General Operations', 'super_admin');

INSERT INTO customers (customer_id, address, city, id_proof_type, id_proof_number, loyalty_points) VALUES
(2, 'Flat 402, Green Glen Layout, Bellandur', 'Bengaluru', 'Passport', 'Z1234567', 450),
(3, '12-B Marine Lines, Nariman Point', 'Mumbai', 'Aadhaar Card', '9876-5432-1098', 120),
(4, '78 Satellite Road, Bodakdev', 'Ahmedabad', 'Driving License', 'GJ01-2019-8877', 80),
(5, 'Plot 45, Jubilee Hills', 'Hyderabad', 'Aadhaar Card', '4321-8765-2109', 240),
(6, 'B-4 Civil Lines', 'New Delhi', 'Passport', 'M8976541', 500),
(7, '15 Anna Nagar East', 'Chennai', 'Aadhaar Card', '6543-2109-8765', 90),
(8, '22 Koregaon Park', 'Pune', 'Passport', 'P5432198', 310),
(9, '9 South Extension Part 2', 'New Delhi', 'Aadhaar Card', '1122-3344-5566', 150),
(10, '104 Panampilly Nagar', 'Kochi', 'Driving License', 'KL07-2021-3322', 75);

-- ----------------------------------------------------------------------------
-- 2. ROOM TYPES
-- ----------------------------------------------------------------------------
INSERT INTO room_types (room_type_id, name, code, description, base_price, max_occupancy, bed_type, size_sqft, image_url) VALUES
(1, 'Standard Room', 'STD', '1–2 guests • King or twin bed • Basic modern amenities & affordable pricing. Ideal for solo travelers and couples seeking comfort and value.', 2500.00, 2, 'King or Twin Bed', 320, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'),
(2, 'Deluxe Room', 'DLX', '2–3 guests • King-size bed • Larger room with upgraded contemporary furnishings, seating lounge, and premium amenities.', 4000.00, 3, 'King-Size Bed', 450, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'),
(3, 'Executive Room', 'EXEC', '2–3 guests • King-size bed • Spacious dedicated workspace and premium executive amenities.', 5500.00, 3, 'King-Size Bed', 540, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'),
(4, 'Family Room', 'FAM', '3–5 guests • Multiple beds • Generous larger space designed for families with kids, dining nook, and family-friendly amenities.', 6800.00, 5, 'Multiple Beds (2 Queen + 1 Twin)', 700, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80'),
(5, 'Suite', 'STE', '2–4 guests • King-size bed • Separate master bedroom and private living area with bespoke luxury amenities and marble bath.', 9500.00, 4, 'King-Size Bed', 860, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'),
(6, 'Presidential Suite', 'PRES', '2–4 guests • King-size bed • Expansive master bedroom and grand living room with premium luxury furnishings and high-end amenities.', 15000.00, 4, 'King-Size Bed', 1350, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80');

-- ----------------------------------------------------------------------------
-- 3. AMENITIES
-- ----------------------------------------------------------------------------
INSERT INTO amenities (amenity_id, name, icon, category) VALUES
(1, 'High-Speed Wi-Fi', 'Wifi', 'Connectivity'),
(2, 'Dual-Zone Air Conditioning', 'AirVent', 'Climate'),
(3, '55" Ultra HD Smart TV', 'Tv', 'Entertainment'),
(5, 'Electronic In-Room Safe', 'ShieldCheck', 'Security'),
(6, 'Marble En-Suite Jacuzzi', 'Bath', 'Luxury'),
(8, 'Espresso & Herbal Tea Maker', 'Coffee', 'Dining'),
(9, '24/7 Concierge & Room Service', 'Clock', 'Service'),
(10, 'Spacious Executive Workspace', 'Laptop', 'Business'),
(11, 'Separate Living Area', 'Layers', 'Space');

-- Junction Table: Room Type Amenities
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5), (1, 8),
(2, 1), (2, 2), (2, 3), (2, 5), (2, 8), (2, 9),
(3, 1), (3, 2), (3, 3), (3, 5), (3, 8), (3, 9), (3, 10),
(4, 1), (4, 2), (4, 3), (4, 5), (4, 8), (4, 9), (4, 11),
(5, 1), (5, 2), (5, 3), (5, 5), (5, 6), (5, 8), (5, 9), (5, 11),
(6, 1), (6, 2), (6, 3), (6, 5), (6, 6), (6, 8), (6, 9), (6, 10), (6, 11);

-- ----------------------------------------------------------------------------
-- 4. ROOMS (24 Physical Rooms across Floors 1 to 4)
-- ----------------------------------------------------------------------------
INSERT INTO rooms (room_id, room_number, room_type_id, floor_number, status, image_url, notes) VALUES
(1, '101', 1, 1, 'Available', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', 'King bed • Quiet courtyard aspect'),
(2, '102', 1, 1, 'Available', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80', 'Twin beds • Near elevator lobby'),
(3, '103', 1, 1, 'Occupied', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', 'King bed • Guest checked in'),
(4, '104', 1, 1, 'Available', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80', 'Twin beds • Garden walkway view'),
(5, '105', 2, 1, 'Reserved', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Deluxe lounge seating'),
(6, '106', 2, 1, 'Available', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Poolside garden view'),
(7, '201', 2, 2, 'Available', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=900&q=80', 'King-size bed • Corner deluxe room'),
(8, '202', 2, 2, 'Occupied', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80', 'King-size bed • Guest staying'),
(9, '203', 3, 2, 'Available', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Ergo workstation & executive desk'),
(10, '204', 3, 2, 'Available', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Executive floor with lounge access'),
(11, '205', 3, 2, 'Reserved', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'Spacious desk & panoramic glass'),
(12, '301', 3, 3, 'Available', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', 'High-floor quiet executive wing'),
(13, '206', 4, 2, 'Available', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', '2 Queen + 1 Twin bed • Family dining nook'),
(14, '302', 4, 3, 'Available', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Spacious family layout with kids area'),
(15, '303', 4, 3, 'Occupied', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Family vacation stay in progress'),
(16, '304', 4, 3, 'Available', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80', 'Interconnected family suite space'),
(17, '305', 5, 3, 'Maintenance', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Separate living area • Scheduled servicing'),
(18, '306', 5, 3, 'Available', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Separate bedroom & living salon'),
(19, '401', 5, 4, 'Available', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Luxury suite with private Jacuzzi'),
(20, '402', 5, 4, 'Available', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80', 'Sunset terrace & living lounge'),
(21, '403', 6, 4, 'Occupied', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Presidential wing • Grand living & dining'),
(22, '404', 6, 4, 'Available', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Royal King bedroom + private dining lounge'),
(23, '405', 6, 4, 'Available', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Penthouse Presidential Suite • 360° vista'),
(24, '406', 6, 4, 'Available', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80', 'Ambassador Presidential Residence');

-- ----------------------------------------------------------------------------
-- 5. HOTEL SERVICES
-- ----------------------------------------------------------------------------
INSERT INTO services (service_id, name, description, price, charge_type, icon) VALUES
(1, 'Gourmet Buffet Breakfast', 'Lavish continental and authentic Indian breakfast buffet prepared fresh by master chefs.', 450.00, 'per_day', 'Utensils'),
(2, 'Luxury Airport Chauffeur', 'Private chauffeured sedan airport transfer with flight tracking and baggage handling.', 1200.00, 'per_booking', 'Car'),
(3, 'Express Laundry & Dry Clean', 'Next-day professional steam pressing, wash, and delicate fabric care.', 350.00, 'per_booking', 'Shirt'),
(4, 'Rejuvenating Ayurvedic Spa', '60-minute relaxing full-body aroma-oil massage and herbal foot reflexology.', 2500.00, 'per_person', 'Sparkles'),
(5, 'Extra Rollaway Bed & Linens', 'Comfortable rollaway single mattress with luxury sheets, duvet, and pillows.', 800.00, 'per_day', 'Bed');

-- ----------------------------------------------------------------------------
-- 6. SAMPLE BOOKINGS & JUNCTION RECORDS
-- ----------------------------------------------------------------------------
INSERT INTO bookings (booking_id, booking_reference, customer_id, check_in_date, check_out_date, total_guests, room_charges, services_charges, tax_amount, total_amount, booking_status, payment_status, special_requests) VALUES
(1, 'SE-2026-1001', 2, '2026-10-10', '2026-10-13', 2, 12000.00, 1650.00, 1638.00, 15288.00, 'Confirmed', 'Paid', 'High floor requested, quiet corner please.'),
(2, 'SE-2026-1002', 3, '2026-10-02', '2026-10-05', 1, 7500.00, 450.00, 954.00, 8904.00, 'Checked-In', 'Paid', 'Late check-in around 9:00 PM.'),
(3, 'SE-2026-1003', 4, '2026-10-15', '2026-10-18', 2, 16500.00, 1200.00, 2124.00, 19824.00, 'Confirmed', 'Paid', 'Need airport pickup at Terminal 2.'),
(4, 'SE-2026-1004', 5, '2026-09-20', '2026-09-23', 4, 20400.00, 2900.00, 2796.00, 26096.00, 'Checked-Out', 'Paid', 'Family vacation with two kids.'),
(5, 'SE-2026-1005', 6, '2026-10-01', '2026-10-04', 2, 45000.00, 2500.00, 5700.00, 53200.00, 'Checked-In', 'Paid', 'VIP stay in Presidential Suite.'),
(6, 'SE-2026-1006', 7, '2026-10-25', '2026-10-27', 1, 5000.00, 0.00, 600.00, 5600.00, 'Pending', 'Pending', 'Will pay cash at reception.'),
(7, 'SE-2026-1007', 8, '2026-09-10', '2026-09-12', 2, 8000.00, 900.00, 1068.00, 9968.00, 'Checked-Out', 'Paid', 'Attending medical conference.'),
(8, 'SE-2026-1008', 9, '2026-11-05', '2026-11-08', 3, 16500.00, 2500.00, 2280.00, 21280.00, 'Confirmed', 'Paid', 'Spa appointments on second day.'),
(9, 'SE-2026-1009', 10, '2026-09-28', '2026-09-30', 2, 8000.00, 0.00, 960.00, 8960.00, 'Cancelled', 'Refunded', 'Trip cancelled due to sudden emergency.'),
(10, 'SE-2026-1010', 2, '2026-11-15', '2026-11-18', 2, 28500.00, 0.00, 3420.00, 31920.00, 'Confirmed', 'Paid', 'Anniversary stay in Suite.');

-- Booking Rooms Junction
INSERT INTO booking_rooms (booking_id, room_id, price_per_night, nights, subtotal) VALUES
(1, 5, 4000.00, 3, 12000.00),
(2, 3, 2500.00, 3, 7500.00),
(3, 11, 5500.00, 3, 16500.00),
(4, 15, 6800.00, 3, 20400.00),
(5, 21, 15000.00, 3, 45000.00),
(6, 4, 2500.00, 2, 5000.00),
(7, 8, 4000.00, 2, 8000.00),
(8, 12, 5500.00, 3, 16500.00),
(9, 7, 4000.00, 2, 8000.00),
(10, 20, 9500.00, 3, 28500.00);

-- Booking Services Junction
INSERT INTO booking_services (booking_id, service_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 450.00, 450.00),
(1, 2, 1, 1200.00, 1200.00),
(2, 1, 1, 450.00, 450.00),
(3, 2, 1, 1200.00, 1200.00),
(4, 1, 2, 450.00, 900.00),
(4, 5, 1, 800.00, 800.00),
(4, 2, 1, 1200.00, 1200.00),
(5, 4, 1, 2500.00, 2500.00),
(7, 1, 2, 450.00, 900.00),
(8, 4, 1, 2500.00, 2500.00);

-- ----------------------------------------------------------------------------
-- 7. PAYMENTS
-- ----------------------------------------------------------------------------
INSERT INTO payments (payment_id, booking_id, transaction_reference, amount, payment_method, payment_status, card_last_four, paid_at) VALUES
(1, 1, 'TXN-CARD-9921', 15288.00, 'Demo Card Payment', 'Completed', '4242', '2026-10-01 14:22:10'),
(2, 2, 'TXN-CASH-1002', 8904.00, 'Cash at Hotel', 'Completed', NULL, '2026-10-02 18:45:00'),
(3, 3, 'TXN-CARD-8832', 19824.00, 'Demo Card Payment', 'Completed', '8812', '2026-10-02 11:30:15'),
(4, 4, 'TXN-CARD-7741', 26096.00, 'Demo Card Payment', 'Completed', '1109', '2026-09-18 09:12:44'),
(5, 5, 'TXN-CARD-6650', 53200.00, 'Demo Card Payment', 'Completed', '5523', '2026-09-30 16:50:20'),
(6, 7, 'TXN-CASH-1007', 9968.00, 'Cash at Hotel', 'Completed', NULL, '2026-09-10 12:05:00'),
(7, 8, 'TXN-CARD-5542', 21280.00, 'Demo Card Payment', 'Completed', '9012', '2026-10-01 20:10:00'),
(8, 9, 'TXN-REFUND-909', 8960.0, 'Demo Card Payment', 'Refunded', '3341', '2026-09-29 10:00:00'),
(9, 10, 'TXN-CARD-4431', 31920.00, 'Demo Card Payment', 'Completed', '4242', '2026-10-02 19:40:00');

-- ----------------------------------------------------------------------------
-- 8. REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (review_id, customer_id, room_type_id, rating, comment, guest_name) VALUES
(1, 2, 2, 5, 'Exceptional experience! The Deluxe Room was spacious with upgraded furnishings, and the breakfast spread was five-star.', 'Aditya Mehta'),
(2, 6, 6, 5, 'The Presidential Suite exceeded all expectations. Expansive living room, private butler service, and luxury furnishings made our stay unforgettable.', 'Vikram Malhotra'),
(3, 4, 3, 5, 'Executive Room was ideal for my business trip. Spacious workspace, fast Wi-Fi, and panoramic views.', 'Rajesh Patel'),
(4, 5, 4, 5, 'Family Room gave our kids plenty of space with multiple comfortable beds. The airport chauffeur pickup was seamless.', 'Sneha Reddy'),
(5, 8, 5, 5, 'The Suite with a separate living area and marble jacuzzi was pure luxury. Will definitely return!', 'Rohan Kapoor');
