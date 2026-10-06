/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Amenity {
  amenityId: number;
  name: string;
  icon: string;
  category: string;
}

export interface RoomType {
  roomTypeId: number;
  name: string;
  code: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  bedType: string;
  sizeSqft: number;
  imageUrl: string;
  amenities: Amenity[];
  isActive?: boolean;
  totalRooms?: number;
  availableRooms?: number;
}

export type RoomPhysicalStatus = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';
export type HousekeepingStatus = 'Clean' | 'Dirty' | 'Cleaning in Progress' | 'Inspected';

export interface Room {
  roomId: number;
  roomNumber: string;
  roomTypeId: number;
  floorNumber: number;
  physicalStatus: RoomPhysicalStatus;
  housekeepingStatus?: HousekeepingStatus;
  assignedHousekeeper?: string;
  isAvailableForQuery: boolean;
  imageUrl: string;
  notes: string;
  roomType: RoomType;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  discountAmount?: number;
}

export interface AvailabilityMatrixItem {
  roomId: number;
  roomNumber: string;
  roomTypeName: string;
  housekeepingStatus: string;
  basePrice: number;
  days: Record<string, { status: string; price: number }>;
}

export interface HotelService {
  serviceId: number;
  name: string;
  description: string;
  price: number;
  chargeType: 'per_booking' | 'per_day' | 'per_person';
  icon: string;
  isActive: boolean;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed';

export interface Booking {
  bookingId: number;
  bookingReference: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  roomCharges: number;
  servicesCharges: number;
  taxAmount: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  paymentMethod?: string;
  transactionReference?: string;
  createdAt: string;
  room?: {
    roomId: number;
    roomNumber: string;
    roomTypeName: string;
    bedType: string;
    imageUrl: string;
  };
  rooms?: any[];
  services?: any[];
  payments?: any[];
}

export interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  address?: string;
  city?: string;
  loyaltyPoints?: number;
  department?: string;
  accessLevel?: string;
  permissions?: string[];
  dashboardUrl?: string;
}

export interface CustomerSummary {
  customerId?: number;
  customer_id?: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  loyaltyPoints?: number;
  loyalty_points?: number;
  registrationDate?: string;
  registration_date?: string;
  totalBookings?: number;
  total_bookings?: number;
  totalSpent?: number;
  total_spent?: number;
}

export interface PaymentRecord {
  paymentId: number;
  bookingId: number;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  transactionReference: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  cardLastFour?: string;
  paidAt: string;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalPaymentsCollected: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  totalCustomers: number;
}
