/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Room,
  RoomType,
  HotelService,
  Booking,
  User,
  DashboardStats,
  CustomerSummary,
  PaymentRecord,
} from '../types/index.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('stayease_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new ApiError(data.message || 'Request failed', res.status);
  }
  return data;
}

export const api = {
  // Guest Portal Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // Dedicated Admin Portal Auth
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async verifyAdminSession(): Promise<{ success: boolean; authorized: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/admin/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
  }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(data: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Rooms
  async getRooms(params: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomTypeId?: number;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    availability?: string;
    sortBy?: string;
  } = {}): Promise<{ success: boolean; count: number; rooms: Room[] }> {
    const query = new URLSearchParams();
    if (params.checkIn) query.append('checkIn', params.checkIn);
    if (params.checkOut) query.append('checkOut', params.checkOut);
    if (params.guests) query.append('guests', params.guests.toString());
    if (params.roomTypeId) query.append('roomTypeId', params.roomTypeId.toString());
    if (params.minPrice) query.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());
    if (params.status) query.append('status', params.status);
    if (params.availability) query.append('availability', params.availability);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const res = await fetch(`${API_BASE}/rooms?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRoomById(id: number): Promise<{ success: boolean; room: Room & { reviews: any[] } }> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createRoom(data: any): Promise<{ success: boolean; message: string; roomId: number }> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateRoom(id: number, data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRoom(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Room Types
  async getRoomTypes(): Promise<{ success: boolean; count: number; roomTypes: RoomType[] }> {
    const res = await fetch(`${API_BASE}/room-types`);
    return handleResponse(res);
  },

  async createRoomType(data: any): Promise<{ success: boolean; message: string; roomTypeId: number }> {
    const res = await fetch(`${API_BASE}/room-types`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateRoomType(id: number, data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/room-types/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRoomType(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/room-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Services
  async getServices(): Promise<{ success: boolean; count: number; services: HotelService[] }> {
    const res = await fetch(`${API_BASE}/services`);
    return handleResponse(res);
  },

  async createService(data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateService(id: number, data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteService(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Bookings
  async getBookings(params: { status?: string; search?: string } = {}): Promise<{ success: boolean; count: number; bookings: Booking[] }> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/bookings?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getBookingById(id: number): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createBooking(data: any): Promise<{ success: boolean; message: string; booking: any }> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateBookingStatus(id: number, status: string, paymentStatus?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, paymentStatus }),
    });
    return handleResponse(res);
  },

  async cancelBooking(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async validateCoupon(code: string, subtotal: number): Promise<{ success: boolean; message: string; coupon: any }> {
    const res = await fetch(`${API_BASE}/bookings/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    return handleResponse(res);
  },

  async updateHousekeeping(id: number, housekeepingStatus: string, assignedHousekeeper?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rooms/${id}/housekeeping`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ housekeepingStatus, assignedHousekeeper }),
    });
    return handleResponse(res);
  },

  async getAvailabilityMatrix(): Promise<{ success: boolean; dates: string[]; matrix: any[] }> {
    const res = await fetch(`${API_BASE}/reports/availability-matrix`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Customers (Admin)
  async getCustomers(search?: string): Promise<{ success: boolean; count: number; customers: CustomerSummary[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/customers${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCustomerById(id: number): Promise<{ success: boolean; customer: CustomerSummary & { bookings: any[] } }> {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Payments (Admin)
  async getPayments(params: { status?: string; method?: string } = {}): Promise<{ success: boolean; count: number; totalCollected: number; payments: PaymentRecord[] }> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.method) query.append('method', params.method);

    const res = await fetch(`${API_BASE}/payments?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Reports & Analytics (Admin)
  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    const res = await fetch(`${API_BASE}/reports/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRevenueReport(): Promise<{ success: boolean; roomTypeRevenue: any[]; monthlyTrends: any[]; floorOccupancy: any[] }> {
    const res = await fetch(`${API_BASE}/reports/revenue`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getVivaSQLShowcase(): Promise<{ success: boolean; count: number; queries: any[] }> {
    const res = await fetch(`${API_BASE}/reports/sql-viva`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Reviews
  async getReviews(): Promise<{ success: boolean; reviews: any[] }> {
    const res = await fetch(`${API_BASE}/system/reviews`);
    return handleResponse(res);
  },

  async postReview(data: { roomTypeId: number; rating: number; comment: string; guestName?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Reset Demo System
  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
