-- ============================================================================
-- StayEase Hotel Management System - Key RDBMS Queries & Reporting Showcase
-- College OOPS + RDBMS Viva / Exam Showcase
-- Demonstrates:
-- 1. Date Overlap Availability Logic (Subquery & Negation)
-- 2. Inner & Left Joins with Multi-Table Aggregation
-- 3. GROUP BY and HAVING clauses
-- 4. Revenue & Occupancy Analytics
-- 5. Subqueries & Window-style logic
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: ROOM AVAILABILITY CHECK WITH DATE-OVERLAP LOGIC
-- Purpose: Returns all rooms available for check-in 2026-10-10 to check-out 2026-10-15
-- Logic: A room is unavailable if it is in maintenance OR has an active booking
-- where (booking.check_in_date < requested_checkout AND booking.check_out_date > requested_checkin)
-- ----------------------------------------------------------------------------
SELECT 
    r.room_id,
    r.room_number,
    r.floor_number,
    r.status AS physical_status,
    rt.room_type_id,
    rt.name AS room_type_name,
    rt.base_price,
    rt.max_occupancy,
    rt.bed_type,
    rt.image_url
FROM rooms r
INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE r.status != 'Maintenance'
  AND r.room_id NOT IN (
      SELECT br.room_id
      FROM booking_rooms br
      INNER JOIN bookings b ON br.booking_id = b.booking_id
      WHERE b.booking_status NOT IN ('Cancelled')
        AND b.check_in_date < '2026-10-15'
        AND b.check_out_date > '2026-10-10'
  )
ORDER BY rt.base_price ASC, r.room_number ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: TOTAL HOTEL REVENUE BREAKDOWN
-- Demonstrates: Aggregate functions (SUM, COUNT), LEFT JOIN, and grouping
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(b.booking_id) AS total_paid_bookings,
    SUM(b.room_charges) AS total_room_revenue,
    SUM(b.services_charges) AS total_services_revenue,
    SUM(b.tax_amount) AS total_taxes_collected,
    SUM(b.total_amount) AS gross_revenue
FROM bookings b
WHERE b.payment_status = 'Paid'
  AND b.booking_status NOT IN ('Cancelled');

-- ----------------------------------------------------------------------------
-- QUERY 3: REVENUE & BOOKING COUNT BY ROOM TYPE
-- Demonstrates: Multi-table JOIN (room_types -> rooms -> booking_rooms -> bookings),
-- GROUP BY, and aggregate calculation
-- ----------------------------------------------------------------------------
SELECT 
    rt.room_type_id,
    rt.name AS room_type_name,
    COUNT(DISTINCT br.booking_id) AS total_reservations,
    SUM(br.nights) AS total_room_nights_sold,
    COALESCE(SUM(br.subtotal), 0) AS total_room_revenue,
    ROUND(AVG(br.price_per_night), 2) AS average_realized_rate
FROM room_types rt
LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id
LEFT JOIN booking_rooms br ON r.room_id = br.room_id
LEFT JOIN bookings b ON br.booking_id = b.booking_id AND b.booking_status NOT IN ('Cancelled')
GROUP BY rt.room_type_id, rt.name
ORDER BY total_room_revenue DESC;

-- ----------------------------------------------------------------------------
-- QUERY 4: MONTHLY BOOKING & REVENUE TREND
-- Demonstrates: Date formatting functions, GROUP BY, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(b.created_at, '%Y-%m') AS booking_month,
    COUNT(b.booking_id) AS total_bookings,
    SUM(CASE WHEN b.booking_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
    SUM(CASE WHEN b.booking_status != 'Cancelled' THEN b.total_amount ELSE 0 END) AS net_revenue
FROM bookings b
GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
ORDER BY booking_month ASC;

-- ----------------------------------------------------------------------------
-- QUERY 5: HIGH-VALUE CUSTOMERS (HAVING CLAUSE DEMO)
-- Demonstrates: INNER JOIN (users -> customers -> bookings), GROUP BY, HAVING total > 15,000
-- ----------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.name AS customer_name,
    u.email,
    u.phone,
    c.city,
    c.loyalty_points,
    COUNT(b.booking_id) AS bookings_count,
    SUM(b.total_amount) AS lifetime_expenditure
FROM users u
INNER JOIN customers c ON u.user_id = c.customer_id
INNER JOIN bookings b ON u.user_id = b.customer_id
WHERE b.booking_status NOT IN ('Cancelled')
GROUP BY u.user_id, u.name, u.email, u.phone, c.city, c.loyalty_points
HAVING lifetime_expenditure >= 15000
ORDER BY lifetime_expenditure DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: HOTEL OCCUPANCY RATE BY FLOOR
-- Demonstrates: Conditional aggregation (SUM(CASE ...)) and percentage calculation
-- ----------------------------------------------------------------------------
SELECT 
    r.floor_number,
    COUNT(r.room_id) AS total_rooms_on_floor,
    SUM(CASE WHEN r.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_rooms,
    SUM(CASE WHEN r.status = 'Available' THEN 1 ELSE 0 END) AS available_rooms,
    ROUND(
        (SUM(CASE WHEN r.status = 'Occupied' THEN 1 ELSE 0 END) * 100.0) / COUNT(r.room_id), 
        1
    ) AS occupancy_percentage
FROM rooms r
GROUP BY r.floor_number
ORDER BY r.floor_number ASC;

-- ----------------------------------------------------------------------------
-- QUERY 7: MOST POPULAR ADD-ON HOTEL SERVICES
-- Demonstrates: Junction table aggregation with ranking
-- ----------------------------------------------------------------------------
SELECT 
    s.service_id,
    s.name AS service_name,
    s.price,
    s.charge_type,
    COUNT(bs.booking_id) AS times_ordered,
    COALESCE(SUM(bs.quantity), 0) AS total_units_consumed,
    COALESCE(SUM(bs.subtotal), 0) AS total_service_revenue
FROM services s
LEFT JOIN booking_services bs ON s.service_id = bs.service_id
GROUP BY s.service_id, s.name, s.price, s.charge_type
ORDER BY total_service_revenue DESC;

-- ----------------------------------------------------------------------------
-- QUERY 8: FULL BOOKING DOSSIER WITH MULTI-TABLE JOIN
-- Demonstrates: Comprehensive relational query linking 5 tables for invoice generation
-- ----------------------------------------------------------------------------
SELECT 
    b.booking_id,
    b.booking_reference,
    b.check_in_date,
    b.check_out_date,
    b.booking_status,
    b.payment_status,
    b.total_amount,
    u.name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    r.room_number,
    rt.name AS room_type_name,
    p.transaction_reference,
    p.payment_method
FROM bookings b
INNER JOIN users u ON b.customer_id = u.user_id
INNER JOIN booking_rooms br ON b.booking_id = br.booking_id
INNER JOIN rooms r ON br.room_id = r.room_id
INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
ORDER BY b.booking_id DESC;

-- ----------------------------------------------------------------------------
-- QUERY 9: ROOM TYPE AMENITIES (M:N JUNCTION EXPLORATION)
-- Demonstrates: GROUP_CONCAT or string aggregation across many-to-many relationship
-- ----------------------------------------------------------------------------
SELECT 
    rt.room_type_id,
    rt.name AS room_type_name,
    rt.base_price,
    rt.bed_type,
    GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS bundled_amenities
FROM room_types rt
LEFT JOIN room_type_amenities rta ON rt.room_type_id = rta.room_type_id
LEFT JOIN amenities a ON rta.amenity_id = a.amenity_id
GROUP BY rt.room_type_id, rt.name, rt.base_price, rt.bed_type;

-- ----------------------------------------------------------------------------
-- QUERY 10: TODAY'S OPERATIONAL CHECK-INS AND CHECK-OUTS
-- Demonstrates: CURRENT_DATE filtering for front desk operations
-- ----------------------------------------------------------------------------
SELECT 
    b.booking_id,
    b.booking_reference,
    'CHECK-IN' AS operation_type,
    u.name AS guest_name,
    u.phone AS guest_phone,
    r.room_number,
    rt.name AS room_category,
    b.booking_status
FROM bookings b
INNER JOIN users u ON b.customer_id = u.user_id
INNER JOIN booking_rooms br ON b.booking_id = br.booking_id
INNER JOIN rooms r ON br.room_id = r.room_id
INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.check_in_date = CURRENT_DATE
  AND b.booking_status IN ('Confirmed', 'Pending')

UNION ALL

SELECT 
    b.booking_id,
    b.booking_reference,
    'CHECK-OUT' AS operation_type,
    u.name AS guest_name,
    u.phone AS guest_phone,
    r.room_number,
    rt.name AS room_category,
    b.booking_status
FROM bookings b
INNER JOIN users u ON b.customer_id = u.user_id
INNER JOIN booking_rooms br ON b.booking_id = br.booking_id
INNER JOIN rooms r ON br.room_id = r.room_id
INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.check_out_date = CURRENT_DATE
  AND b.booking_status = 'Checked-In';
