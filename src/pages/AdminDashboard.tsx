/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  DashboardStats,
  Room,
  RoomType,
  Booking,
  CustomerSummary,
} from '../types/index.js';
import {
  LayoutDashboard,
  Bed,
  Layers,
  CalendarCheck,
  Users,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  X,
  Shield,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Home,
} from 'lucide-react';

/**
 * Protected Admin Portal Dashboard (`/admin/dashboard`)
 * - Independently verifies `ADMIN` role authorization with the backend
 *   (`GET /api/auth/admin/verify`) on mount.
 * - If an unauthenticated visitor accesses `/admin/dashboard`, redirects to `/admin/login`.
 * - If a logged-in Guest (`role === 'customer'`) manually enters `/admin/dashboard`
 *   in the URL bar, displays a 403 Forbidden / Unauthorized security screen and
 *   blocks all admin data and operations.
 */
export const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Active Section in Admin Portal
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'rooms' | 'roomTypes' | 'bookings' | 'guests'
  >('dashboard');

  // Security / Role Verification State
  const [verifyingAccess, setVerifyingAccess] = useState(true);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

  // Dashboard Stats & Charts
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<{
    roomTypeRevenue: any[];
    monthlyTrends: any[];
    floorOccupancy: any[];
  } | null>(null);

  // Management Data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guestsList, setGuestsList] = useState<CustomerSummary[]>([]);

  // Search & Filter controls
  const [searchBooking, setSearchBooking] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [roomStatusFilter, setRoomStatusFilter] = useState('All');
  const [guestSearch, setGuestSearch] = useState('');

  // Room Modal state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomTypeId: 1,
    floorNumber: 1,
    status: 'Available',
    notes: '',
  });

  // Room Category (RoomType) Modal state
  const [roomTypeModalOpen, setRoomTypeModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [roomTypeForm, setRoomTypeForm] = useState({
    name: '',
    code: '',
    description: '',
    basePrice: 3500,
    maxOccupancy: 2,
    bedType: 'King-Size Bed',
    sizeSqft: 400,
    imageUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // 1. Unauthenticated users are redirected to the separate /admin/login page
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // 2. Verify ADMIN role directly with the backend database
    verifyAndLoadAdminPortal();
  }, [user, authLoading]);

  const verifyAndLoadAdminPortal = async () => {
    setVerifyingAccess(true);
    setAccessDeniedError(null);
    try {
      await api.verifyAdminSession();
      setVerifyingAccess(false);
      await loadAllAdminData();
    } catch (err: any) {
      setVerifyingAccess(false);
      setAccessDeniedError(
        err.message ||
          '403 Forbidden: Guest accounts are strictly prohibited from accessing the Admin Portal.'
      );
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, roomsRes, roomTypesRes, bookingsRes, customersRes] =
        await Promise.all([
          api.getDashboardStats(),
          api.getRevenueReport(),
          api.getRooms(),
          api.getRoomTypes(),
          api.getBookings(),
          api.getCustomers(),
        ]);

      setStats(statsRes.stats);
      setRevenueData(revenueRes);
      setRooms(roomsRes.rooms);
      setRoomTypes(roomTypesRes.roomTypes);
      setBookings(bookingsRes.bookings);
      setGuestsList(customersRes.customers);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ROOM CRUD ACTIONS
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      roomNumber: '',
      roomTypeId: roomTypes[0]?.roomTypeId || 1,
      floorNumber: 1,
      status: 'Available',
      notes: '',
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      floorNumber: room.floorNumber,
      status: room.physicalStatus,
      notes: room.notes,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.roomId, roomForm);
        setActionMessage(`Room #${roomForm.roomNumber} updated successfully.`);
      } else {
        await api.createRoom(roomForm);
        setActionMessage(`New Room #${roomForm.roomNumber} added to Phoenix inventory.`);
      }
      setRoomModalOpen(false);
      await loadAllAdminData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteRoom = async (roomId: number, roomNum: string) => {
    if (!confirm(`Delete Room #${roomNum}?`)) return;
    try {
      await api.deleteRoom(roomId);
      setActionMessage(`Room #${roomNum} deleted.`);
      await loadAllAdminData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Cannot delete room with active bookings.');
    }
  };

  // ROOM CATEGORY (ROOM TYPE) CRUD ACTIONS
  const handleOpenAddRoomType = () => {
    setEditingRoomType(null);
    setRoomTypeForm({
      name: '',
      code: '',
      description: '',
      basePrice: 4000,
      maxOccupancy: 2,
      bedType: 'King-Size Bed',
      sizeSqft: 420,
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    });
    setRoomTypeModalOpen(true);
  };

  const handleOpenEditRoomType = (rt: RoomType) => {
    setEditingRoomType(rt);
    setRoomTypeForm({
      name: rt.name,
      code: rt.code,
      description: rt.description,
      basePrice: rt.basePrice,
      maxOccupancy: rt.maxOccupancy,
      bedType: rt.bedType,
      sizeSqft: rt.sizeSqft,
      imageUrl: rt.imageUrl,
    });
    setRoomTypeModalOpen(true);
  };

  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoomType) {
        await api.updateRoomType(editingRoomType.roomTypeId, roomTypeForm);
        setActionMessage(`Suite category "${roomTypeForm.name}" updated.`);
      } else {
        await api.createRoomType(roomTypeForm);
        setActionMessage(`New suite category "${roomTypeForm.name}" created.`);
      }
      setRoomTypeModalOpen(false);
      await loadAllAdminData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save room category.');
    }
  };

  // BOOKING STATUS UPDATE
  const handleStatusChange = async (bookingId: number, status: string, paymentStatus?: string) => {
    try {
      await api.updateBookingStatus(bookingId, status, paymentStatus);
      setActionMessage(`Booking #${bookingId} updated to ${status}.`);
      await loadAllAdminData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Loading state while checking backend token & role
  if (authLoading || verifyingAccess) {
    return (
      <div className="min-h-screen bg-[#0B1F33] text-[#F8F5EF] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Shield className="w-8 h-8 text-[#C9A45C] mx-auto animate-pulse" />
          <p className="text-xs font-semibold tracking-wider text-[#EDE7DC]">
            VERIFYING ADMINISTRATOR ROLE AUTHORIZATION...
          </p>
        </div>
      </div>
    );
  }

  // 403 FORBIDDEN SCREEN: Shown if a Guest manually navigates to /admin/dashboard
  if (accessDeniedError || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0B1F33] text-[#F8F5EF] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#F8F5EF] text-[#252525] rounded-3xl shadow-2xl border border-[#9B4545]/50 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#9B4545]/15 text-[#9B4545] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 rounded-lg bg-[#9B4545] text-[#F8F5EF] text-xs font-mono font-bold">
            HTTP 403 FORBIDDEN · UNAUTHORIZED ROLE
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#0B1F33]">
            Admin Portal Access Denied
          </h1>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            {accessDeniedError ||
              'Your account is registered with the GUEST role. Only authenticated ADMIN accounts are permitted to access hotel administration routes and APIs.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#132B45] text-[#C9A45C] text-xs font-bold cursor-pointer"
            >
              Sign In at Admin Login (/admin/login)
            </button>
            <Link
              to="/customer/bookings"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#EDE7DC] hover:bg-[#C9A45C]/30 text-[#0B1F33] text-xs font-semibold"
            >
              Return to Guest Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Lists
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = bookingStatusFilter === 'All' || b.bookingStatus === bookingStatusFilter;
    const term = searchBooking.toLowerCase();
    const matchesSearch =
      !term ||
      b.bookingReference.toLowerCase().includes(term) ||
      (b.customerName && b.customerName.toLowerCase().includes(term)) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(term)) ||
      (b.room?.roomNumber && b.room.roomNumber.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const filteredRooms = rooms.filter((r) => {
    if (roomStatusFilter === 'All') return true;
    return r.physicalStatus === roomStatusFilter;
  });

  const filteredGuests = guestsList.filter((g) => {
    const term = guestSearch.toLowerCase();
    if (!term) return true;
    return (
      g.name.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.phone.toLowerCase().includes(term) ||
      (g.city && g.city.toLowerCase().includes(term))
    );
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Confirmed':
      case 'Paid':
      case 'Completed':
        return <span className="text-xs font-semibold text-[#3F7652]">{status}</span>;
      case 'Occupied':
      case 'Checked-In':
        return <span className="text-xs font-semibold text-[#0B1F33]">{status}</span>;
      case 'Reserved':
      case 'Pending':
        return <span className="text-xs font-semibold text-[#C9A45C]">{status}</span>;
      case 'Maintenance':
      case 'Cancelled':
      case 'Failed':
        return <span className="text-xs font-semibold text-[#9B4545]">{status}</span>;
      default:
        return <span className="text-xs font-semibold text-[#6B6B6B]">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#252525] flex flex-col lg:flex-row">
      
      {/* LEFT SIDEBAR NAVIGATION (Dedicated Admin Portal Layout) */}
      <aside className="w-full lg:w-64 bg-[#0B1F33] text-[#EDE7DC] shrink-0 flex flex-col justify-between p-5 border-r border-[#C9A45C]/25">
        <div>
          {/* Admin Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#C9A45C]/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A45C] flex items-center justify-center text-[#0B1F33] font-bold shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-[#F8F5EF] text-sm tracking-wide">
                  PHOENIX ADMIN
                </h2>
                <span className="text-[11px] text-[#C9A45C] font-medium block">
                  Admin Portal · RBAC
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Occupancy & Statistics', icon: LayoutDashboard },
              { id: 'rooms', label: 'Room Inventory', icon: Bed },
              { id: 'roomTypes', label: 'Suite Categories & Pricing', icon: Layers },
              { id: 'bookings', label: 'All Reservations', icon: CalendarCheck },
              { id: 'guests', label: 'Guest Accounts', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C9A45C] text-[#0B1F33] shadow-sm'
                      : 'text-[#EDE7DC]/80 hover:bg-[#132B45] hover:text-[#F8F5EF]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-[#C9A45C]/20 mt-8 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-[#132B45] border border-[#C9A45C]/20 text-[11px]">
            <div className="font-semibold text-[#F8F5EF] truncate">{user.name}</div>
            <div className="text-[#C9A45C] font-mono text-[10px] truncate">{user.email}</div>
          </div>
          <Link
            to="/"
            className="w-full px-3.5 py-2 rounded-xl bg-[#132B45] hover:bg-[#1A3756] text-[#EDE7DC] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>View Public Hotel Site</span>
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#9B4545]/20 hover:bg-[#9B4545]/30 text-[#E5989B] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Admin Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#C9A45C]/30">
          <div>
            <span className="text-xs font-semibold text-[#C9A45C]">
              Phoenix Hotel & Suites · Management Console
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B1F33] capitalize mt-0.5">
              {activeSection === 'dashboard'
                ? 'Executive Occupancy & Booking Statistics'
                : activeSection === 'roomTypes'
                ? 'Suite Categories & Pricing'
                : activeSection === 'rooms'
                ? 'Physical Room Inventory & Availability'
                : activeSection === 'bookings'
                ? 'Guest Reservations & Approval'
                : 'Registered Guest Accounts'}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadAllAdminData}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#C9A45C]/35 text-[#0B1F33] hover:bg-[#EDE7DC] text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C9A45C] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Action Toast Message */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#0B1F33] text-[#F8F5EF] border border-[#C9A45C] text-xs font-medium flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#C9A45C]" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-[#EDE7DC]/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================
            SECTION 1: EXECUTIVE DASHBOARD (STATS & OCCUPANCY)
            ========================================================= */}
        {activeSection === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* 4 Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 tabular-nums">
              <div className="bg-white p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
                <span className="text-xs font-medium text-[#6B6B6B]">Total Collected Revenue</span>
                <div className="font-display text-2xl font-bold text-[#0B1F33] mt-1">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#3F7652] font-semibold mt-2 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Direct reservations</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
                <span className="text-xs font-medium text-[#6B6B6B]">Hotel Occupancy Rate</span>
                <div className="font-display text-2xl font-bold text-[#0B1F33] mt-1">
                  {stats.totalRooms > 0
                    ? Math.round(((stats.occupiedRooms + stats.reservedRooms) / stats.totalRooms) * 100)
                    : 0}%
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-2">
                  {stats.occupiedRooms} Occupied / {stats.availableRooms} Available of {stats.totalRooms} Rooms
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
                <span className="text-xs font-medium text-[#6B6B6B]">Active & Confirmed Bookings</span>
                <div className="font-display text-2xl font-bold text-[#0B1F33] mt-1">
                  {stats.confirmedBookings + stats.checkedInBookings}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-2">
                  Out of {stats.totalBookings} total bookings
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
                <span className="text-xs font-medium text-[#6B6B6B]">Registered Guests</span>
                <div className="font-display text-2xl font-bold text-[#0B1F33] mt-1">
                  {stats.totalCustomers}
                </div>
                <div className="text-[11px] text-[#C9A45C] font-semibold mt-2">
                  Verified guest profiles
                </div>
              </div>
            </div>

            {/* Room Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs lg:col-span-2">
                <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-4">
                  Revenue by Suite Category
                </h3>
                <div className="space-y-3.5 tabular-nums">
                  {revenueData?.roomTypeRevenue?.map((rt: any, idx: number) => {
                    const maxRev = Math.max(
                      ...revenueData.roomTypeRevenue.map((r: any) => r.total_revenue || 1),
                      1
                    );
                    const pct = Math.min(100, Math.round(((rt.total_revenue || 0) / maxRev) * 100));
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#0B1F33]">
                            {rt.room_type} <span className="text-[#6B6B6B] font-normal">({rt.bookings_count} bookings)</span>
                          </span>
                          <span className="font-mono font-bold text-[#0B1F33]">
                            ₹{Number(rt.total_revenue || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#EDE7DC] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9A45C] rounded-full"
                            style={{ width: `${Math.max(6, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0B1F33] text-[#F8F5EF] p-6 rounded-2xl border border-[#C9A45C]/30 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-xs text-[#C9A45C] font-semibold">Live Inventory Status</span>
                  <h3 className="font-display text-lg font-semibold mt-1 mb-5">
                    Physical Room Allocation
                  </h3>
                  <div className="space-y-3 text-xs tabular-nums">
                    <div className="flex justify-between py-2 border-b border-[#C9A45C]/15">
                      <span className="text-[#EDE7DC]/80">Available Rooms</span>
                      <span className="font-bold text-[#C9A45C]">{stats.availableRooms}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#C9A45C]/15">
                      <span className="text-[#EDE7DC]/80">Occupied Rooms</span>
                      <span className="font-bold text-[#F8F5EF]">{stats.occupiedRooms}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#C9A45C]/15">
                      <span className="text-[#EDE7DC]/80">Reserved Rooms</span>
                      <span className="font-bold text-[#C9A45C]">{stats.reservedRooms}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#EDE7DC]/80">Under Maintenance</span>
                      <span className="font-bold text-[#E5989B]">{stats.maintenanceRooms}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('rooms')}
                  className="mt-6 w-full py-2.5 rounded-xl bg-[#C9A45C] text-[#0B1F33] font-bold text-xs hover:bg-[#B58E47] transition-colors cursor-pointer"
                >
                  Manage Room Inventory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 2: ROOM INVENTORY MANAGEMENT (ADD / EDIT / DELETE)
            ========================================================= */}
        {activeSection === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
              <div className="flex items-center space-x-2">
                {['All', 'Available', 'Reserved', 'Occupied', 'Maintenance'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRoomStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      roomStatusFilter === st
                        ? 'bg-[#0B1F33] text-[#F8F5EF]'
                        : 'bg-[#F8F5EF] text-[#6B6B6B] hover:text-[#252525]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenAddRoom}
                className="px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Room</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#C9A45C]/30 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0B1F33] text-[#F8F5EF] uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Room #</th>
                      <th className="py-3.5 px-4">Suite Category</th>
                      <th className="py-3.5 px-4">Floor</th>
                      <th className="py-3.5 px-4">Tariff / Night</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Notes</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7DC] tabular-nums">
                    {filteredRooms.map((r) => (
                      <tr key={r.roomId} className="hover:bg-[#F8F5EF]/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                          #{r.roomNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0B1F33]">
                          {r.roomType.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6B6B]">Floor {r.floorNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#0B1F33]">
                          ₹{r.roomType.basePrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">{getStatusText(r.physicalStatus)}</td>
                        <td className="py-3.5 px-4 text-[#6B6B6B] max-w-xs truncate">
                          {r.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditRoom(r)}
                            className="p-1.5 rounded-lg border border-[#C9A45C]/40 text-[#0B1F33] hover:bg-[#EDE7DC] cursor-pointer"
                            title="Edit Room"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(r.roomId, r.roomNumber)}
                            className="p-1.5 rounded-lg border border-[#9B4545]/30 text-[#9B4545] hover:bg-[#9B4545]/10 cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 3: SUITE CATEGORIES & PRICING
            ========================================================= */}
        {activeSection === 'roomTypes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#C9A45C]/30">
              <p className="text-xs text-[#6B6B6B]">
                Configure room categories, nightly tariffs, and maximum guest occupancy.
              </p>
              <button
                onClick={handleOpenAddRoomType}
                className="px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Suite Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map((rt) => (
                <div
                  key={rt.roomTypeId}
                  className="bg-white rounded-2xl border border-[#C9A45C]/30 overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 overflow-hidden bg-[#0B1F33] relative">
                      <img
                        src={rt.imageUrl}
                        alt={rt.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#0B1F33]/90 text-[#C9A45C] font-mono text-[10px] font-bold">
                        {rt.code}
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-[#0B1F33]">
                          {rt.name}
                        </h3>
                        <span className="font-mono text-sm font-bold text-[#0B1F33] tabular-nums">
                          ₹{rt.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B] line-clamp-2">{rt.description}</p>
                      <div className="pt-2 text-[11px] text-[#6B6B6B] flex items-center justify-between border-t border-[#EDE7DC] tabular-nums">
                        <span>Max Guests: {rt.maxOccupancy}</span>
                        <span>{rt.sizeSqft} sq.ft</span>
                        <span>{rt.availableRooms ?? 0}/{rt.totalRooms ?? 0} Free</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-[#F8F5EF] border-t border-[#EDE7DC] flex justify-end">
                    <button
                      onClick={() => handleOpenEditRoomType(rt)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0B1F33] text-[#C9A45C] text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#132B45] cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Tariff & Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 4: ALL BOOKINGS (APPROVE / CANCEL / CHECK-IN)
            ========================================================= */}
        {activeSection === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchBooking}
                  onChange={(e) => setSearchBooking(e.target.value)}
                  placeholder="Search reference, guest name, email, or room #..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setBookingStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        bookingStatusFilter === st
                          ? 'bg-[#0B1F33] text-[#F8F5EF]'
                          : 'bg-[#F8F5EF] text-[#6B6B6B] hover:text-[#252525]'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#C9A45C]/30 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0B1F33] text-[#F8F5EF] uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Reference</th>
                      <th className="py-3.5 px-4">Guest</th>
                      <th className="py-3.5 px-4">Suite / Room</th>
                      <th className="py-3.5 px-4">Stay Dates</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Manage Reservation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7DC] tabular-nums">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-[#F8F5EF]/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                          {b.bookingReference}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0B1F33]">{b.customerName}</div>
                          <div className="text-[11px] text-[#6B6B6B]">{b.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0B1F33]">
                            Room #{b.room?.roomNumber}
                          </div>
                          <div className="text-[11px] text-[#6B6B6B]">{b.room?.roomTypeName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6B6B]">
                          {b.checkInDate} → {b.checkOutDate}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">{getStatusText(b.bookingStatus)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={b.bookingStatus}
                            onChange={(e) => handleStatusChange(b.bookingId, e.target.value)}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/40 text-[#0B1F33] cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Approve / Confirm</option>
                            <option value="Checked-In">Check-In Guest</option>
                            <option value="Checked-Out">Check-Out Guest</option>
                            <option value="Cancelled">Cancel Reservation</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 5: GUEST ACCOUNTS MANAGEMENT
            ========================================================= */}
        {activeSection === 'guests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#C9A45C]/30 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Search registered guest by name, email, phone, or city..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
              <div className="text-xs font-semibold text-[#6B6B6B]">
                Showing {filteredGuests.length} Registered Guest Accounts (Role: GUEST)
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#C9A45C]/30 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0B1F33] text-[#F8F5EF] uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Guest ID</th>
                      <th className="py-3.5 px-4">Guest Name</th>
                      <th className="py-3.5 px-4">Email & Phone</th>
                      <th className="py-3.5 px-4">City / Residence</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Bookings</th>
                      <th className="py-3.5 px-4 text-right">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7DC] tabular-nums">
                    {filteredGuests.map((g) => (
                      <tr key={g.customer_id ?? g.customerId} className="hover:bg-[#F8F5EF]/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B1F33]">
                          #{g.customer_id ?? g.customerId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0B1F33]">{g.name}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-[#252525]">{g.email}</div>
                          <div className="text-[11px] text-[#6B6B6B]">{g.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6B6B]">
                          {g.city || '—'} {g.address ? `· ${g.address}` : ''}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#EDE7DC] text-[#0B1F33] font-mono text-[10px] font-bold">
                            GUEST
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0B1F33]">
                          {g.total_bookings ?? g.totalBookings ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B1F33]">
                          ₹{Number(g.total_spent ?? g.totalSpent ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD / EDIT ROOM */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F8F5EF] w-full max-w-md rounded-3xl border border-[#C9A45C]/40 shadow-2xl overflow-hidden">
            <div className="bg-[#0B1F33] px-6 py-4 text-[#F8F5EF] flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {editingRoom ? `Edit Room #${editingRoom.roomNumber}` : 'Add Physical Room'}
              </h3>
              <button onClick={() => setRoomModalOpen(false)} className="text-[#EDE7DC]/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Floor *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomForm.floorNumber}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, floorNumber: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Suite Category *</label>
                <select
                  value={roomForm.roomTypeId}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, roomTypeId: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.roomTypeId} value={rt.roomTypeId}>
                      {rt.name} (₹{rt.basePrice}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Availability Status *</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Notes / Aspect</label>
                <input
                  type="text"
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0B1F33]/20 text-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A45C] text-[#0B1F33] font-bold cursor-pointer"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SUITE CATEGORY */}
      {roomTypeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F8F5EF] w-full max-w-lg rounded-3xl border border-[#C9A45C]/40 shadow-2xl overflow-hidden">
            <div className="bg-[#0B1F33] px-6 py-4 text-[#F8F5EF] flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {editingRoomType ? `Edit ${editingRoomType.name}` : 'Create Suite Category'}
              </h3>
              <button
                onClick={() => setRoomTypeModalOpen(false)}
                className="text-[#EDE7DC]/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoomType} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={roomTypeForm.name}
                    onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={roomTypeForm.code}
                    onChange={(e) =>
                      setRoomTypeForm({ ...roomTypeForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={roomTypeForm.basePrice}
                    onChange={(e) =>
                      setRoomTypeForm({
                        ...roomTypeForm,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Max Guests *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={roomTypeForm.maxOccupancy}
                    onChange={(e) =>
                      setRoomTypeForm({
                        ...roomTypeForm,
                        maxOccupancy: parseInt(e.target.value, 10) || 2,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Size (sq.ft) *</label>
                  <input
                    type="number"
                    required
                    value={roomTypeForm.sizeSqft}
                    onChange={(e) =>
                      setRoomTypeForm({
                        ...roomTypeForm,
                        sizeSqft: parseInt(e.target.value, 10) || 350,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C9A45C]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={roomTypeForm.description}
                  onChange={(e) =>
                    setRoomTypeForm({ ...roomTypeForm, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-white border border-[#C9A45C]/40"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRoomTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0B1F33]/20 text-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A45C] text-[#0B1F33] font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
