/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { Room, RoomType } from '../types/index.js';
import { RoomCard } from '../components/RoomCard.js';
import { RoomDetailsModal } from '../components/RoomDetailsModal.js';
import {
  Calendar,
  Users,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Bed,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    totalRoomsInCart,
    totalGuestCapacity,
    totalPricePerNight,
    setIsCartOpen,
  } = useCart();
  const isAdmin = user?.role === 'admin';

  // Search & Filter State
  const [checkIn, setCheckIn] = useState(() => searchParams.get('checkIn') || new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    if (searchParams.get('checkOut')) return searchParams.get('checkOut')!;
    const tom = new Date();
    tom.setDate(tom.getDate() + 3);
    return tom.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState<number>(() => {
    const g = searchParams.get('guests');
    return g ? parseInt(g, 10) : 1;
  });

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | undefined>(() => {
    const rt = searchParams.get('roomTypeId');
    return rt ? parseInt(rt, 10) : undefined;
  });
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price_asc');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Room for details modal
  const [modalRoom, setModalRoom] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Load room types once
  useEffect(() => {
    loadRoomTypes();
  }, []);

  // Fetch rooms whenever filters, date, or user role changes
  useEffect(() => {
    loadRooms();
  }, [checkIn, checkOut, guests, selectedRoomTypeId, availabilityFilter, sortBy, selectedAmenities, isAdmin]);

  const loadRoomTypes = async () => {
    try {
      const res = await api.getRoomTypes();
      setRoomTypes(res.roomTypes);
    } catch (err) {
      console.error('Failed to load room types:', err);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRooms({
        checkIn,
        checkOut,
        guests,
        roomTypeId: selectedRoomTypeId,
        availability: availabilityFilter,
        sortBy,
      });

      let filtered = res.rooms;
      // Filter by guest count: allow room types that can accommodate the guests either in 1 room OR across multiple available rooms in cart
      if (guests > 1) {
        filtered = filtered.filter((r) => {
          const maxAvail = Math.max(1, r.roomType.availableRooms ?? 3);
          return r.roomType.maxOccupancy * maxAvail >= guests;
        });
      }

      if (selectedAmenities.length > 0) {
        filtered = filtered.filter((r) =>
          selectedAmenities.every((reqAm) =>
            r.roomType.amenities.some((a) => a.name.toLowerCase().includes(reqAm.toLowerCase()))
          )
        );
      }

      // Always show only ONE room option per room type (prioritizing an available room for the selected dates).
      const oneRoomPerType = new Map<number, Room>();
      for (const room of filtered) {
        const isAvail = room.isAvailableForQuery ?? (room.physicalStatus === 'Available');
        const existing = oneRoomPerType.get(room.roomTypeId);
        if (!existing) {
          oneRoomPerType.set(room.roomTypeId, room);
        } else {
          const existingAvail = existing.isAvailableForQuery ?? (existing.physicalStatus === 'Available');
          if (!existingAvail && isAvail) {
            oneRoomPerType.set(room.roomTypeId, room);
          }
        }
      }
      filtered = Array.from(oneRoomPerType.values());

      setRooms(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to query room availability.');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedRoomTypeId(undefined);
    setAvailabilityFilter('all');
    setSortBy('price_asc');
    setSelectedAmenities([]);
    const today = new Date();
    setCheckIn(today.toISOString().split('T')[0]);
    const tom = new Date();
    tom.setDate(tom.getDate() + 3);
    setCheckOut(tom.toISOString().split('T')[0]);
    setGuests(1);
  };

  const handleBookNow = (room: Room) => {
    navigate(`/book/${room.roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const handleViewDetails = (room: Room) => {
    setModalRoom(room);
    setIsDetailsOpen(true);
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#252525] pb-20">
      
      {/* Page Header */}
      <div className="bg-[#0B1F33] text-[#F8F5EF] py-14 px-4 sm:px-6 lg:px-8 border-b border-[#C9A45C]/30">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[#C9A45C] font-semibold text-xs tracking-widest">
            Phoenix Accommodations & Real-Time Availability
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mt-1 text-[#F8F5EF] tracking-wide">
            Explore Our Rooms & Suites
          </h1>
          <p className="text-[#EDE7DC]/80 text-xs sm:text-sm mt-3 max-w-2xl mx-auto">
            Select from six curated room categories—from refined Standard Rooms to our expansive Presidential Suite.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7">
        
        {/* Date & Guest Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#C9A45C]/35 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] mb-1">
                Check-In Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] mb-1">
                Check-Out Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] mb-1">
                Minimum Occupancy
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                >
                  <option value={1}>1+ Guests (All Categories)</option>
                  <option value={2}>2+ Guests (Single Room or Cart)</option>
                  <option value={3}>3+ Guests (Single Room or Multi-Room Cart)</option>
                  <option value={4}>4+ Guests (Suites or 2 Standard Rooms in Cart)</option>
                  <option value={5}>5+ Guests (Family Room or Multi-Room Cart)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={loadRooms}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Update Results</span>
              </button>
            </div>

          </div>

          {/* Cart Availability Banner for Multi-Room / Registered Guest Booking */}
          <div className="mt-4 pt-3 border-t border-[#EDE7DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-[#6B6B6B]">
              <ShoppingBag className="w-4 h-4 text-[#C9A45C] shrink-0" />
              <span>
                <strong className="text-[#0B1F33]">Multi-Room Cart Available:</strong> Booking for a larger group (e.g., 4 guests in 2 separate Standard Rooms)? Add multiple rooms to your Cart and check out together.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-[#EDE7DC] hover:bg-[#E4DCCE] text-[#0B1F33] border border-[#C9A45C]/40 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span className="tabular-nums">
                {totalRoomsInCart > 0
                  ? `View Cart (${totalRoomsInCart} ${totalRoomsInCart === 1 ? 'Room' : 'Rooms'} · Up to ${totalGuestCapacity} Guests · ₹${totalPricePerNight.toLocaleString('en-IN')}/night)`
                  : 'Open Room Cart (0 Rooms)'}
              </span>
              {totalRoomsInCart > 0 && <ArrowRight className="w-3.5 h-3.5 text-[#C9A45C]" />}
            </button>
          </div>
        </div>

        {/* 6 Room Categories Quick-Select Overview Strip */}
        {roomTypes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {roomTypes.map((rt) => {
              const isSelected = selectedRoomTypeId === rt.roomTypeId;
              return (
                <button
                  key={rt.roomTypeId}
                  onClick={() =>
                    setSelectedRoomTypeId(isSelected ? undefined : rt.roomTypeId)
                  }
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0B1F33] text-[#F8F5EF] border-[#C9A45C] shadow-md ring-1 ring-[#C9A45C]'
                      : 'bg-white text-[#252525] border-[#C9A45C]/25 hover:border-[#C9A45C] shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected ? 'text-[#C9A45C]' : 'text-[#C9A45C]'
                        }`}
                      >
                        {rt.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          (rt.availableRooms ?? 0) > 0
                            ? isSelected
                              ? 'text-[#C9A45C]'
                              : 'text-[#3F7652]'
                            : 'text-[#9B4545]'
                        }`}
                      >
                        {(rt.availableRooms ?? 0) > 0 ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="font-display font-semibold text-xs line-clamp-1">{rt.name}</div>
                    <div
                      className={`text-[10px] mt-0.5 flex items-center gap-1.5 tabular-nums ${
                        isSelected ? 'text-[#EDE7DC]/80' : 'text-[#6B6B6B]'
                      }`}
                    >
                      <span>Up to {rt.maxOccupancy} guests</span>
                      <span>·</span>
                      <span>{rt.sizeSqft} sq.ft</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#C9A45C]/20 flex items-baseline justify-between tabular-nums">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#C9A45C]' : 'text-[#0B1F33]'
                      }`}
                    >
                      ₹{rt.basePrice.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] truncate max-w-[90px] ${
                        isSelected ? 'text-[#EDE7DC]/70' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {rt.bedType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area: Filter Sidebar + Room Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#C9A45C]/30 shadow-2xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE7DC]">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C9A45C]" />
                  <h3 className="font-display font-semibold text-sm text-[#0B1F33]">Filter Accommodations</h3>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#0B1F33] hover:text-[#C9A45C] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* 1. Room Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-2">Room Category</label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedRoomTypeId(undefined)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      selectedRoomTypeId === undefined
                        ? 'bg-[#0B1F33] text-[#F8F5EF] font-semibold'
                        : 'text-[#6B6B6B] hover:bg-[#F8F5EF]'
                    }`}
                  >
                    <span>All Categories ({roomTypes.length})</span>
                    <span className={`text-[10px] ${selectedRoomTypeId === undefined ? 'text-[#C9A45C]' : 'text-[#6B6B6B]'}`}>
                      {roomTypes.length} Suites
                    </span>
                  </button>
                  {roomTypes.map((rt) => (
                    <button
                      key={rt.roomTypeId}
                      onClick={() => setSelectedRoomTypeId(rt.roomTypeId)}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        selectedRoomTypeId === rt.roomTypeId
                          ? 'bg-[#0B1F33] text-[#F8F5EF] font-semibold'
                          : 'text-[#6B6B6B] hover:bg-[#F8F5EF]'
                      }`}
                    >
                      <div>
                        <div>{rt.name}</div>
                        <div className={`text-[10px] ${selectedRoomTypeId === rt.roomTypeId ? 'text-[#EDE7DC]/70' : 'text-[#6B6B6B]'}`}>
                          Max {rt.maxOccupancy} guests
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold tabular-nums ${selectedRoomTypeId === rt.roomTypeId ? 'text-[#C9A45C]' : 'text-[#252525]'}`}>
                        ₹{rt.basePrice.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Guest Occupancy Filter */}
              <div className="pt-3 border-t border-[#EDE7DC]">
                <label className="block text-xs font-semibold text-[#0B1F33] mb-2">
                  Guest Occupancy
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuests(num)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer tabular-nums ${
                        guests === num
                          ? 'bg-[#C9A45C] text-[#0B1F33] border-[#C9A45C]'
                          : 'bg-[#F8F5EF] text-[#252525] border-[#C9A45C]/25 hover:border-[#C9A45C]'
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Availability Status Filter */}
              <div className="pt-3 border-t border-[#EDE7DC]">
                <label className="block text-xs font-semibold text-[#0B1F33] mb-2">
                  Availability Status
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: 'All Rooms (Available & Reserved)' },
                    { id: 'available', label: 'Available Rooms Only' },
                    { id: 'unavailable', label: 'Occupied / Reserved Rooms' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(opt.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        availabilityFilter === opt.id
                          ? 'bg-[#EDE7DC] text-[#0B1F33] font-semibold border border-[#C9A45C]/40'
                          : 'text-[#6B6B6B] hover:bg-[#F8F5EF]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {availabilityFilter === opt.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3F7652]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Amenities Filter */}
              <div className="pt-3 border-t border-[#EDE7DC]">
                <label className="block text-xs font-semibold text-[#0B1F33] mb-2">Suite Amenities</label>
                <div className="space-y-2">
                  {[
                    'Wi-Fi',
                    'Workspace',
                    'Living Area',
                    'Jacuzzi',
                  ].map((am) => {
                    const isChecked = selectedAmenities.includes(am);
                    return (
                      <label
                        key={am}
                        className="flex items-center space-x-2 text-xs text-[#252525] cursor-pointer hover:text-[#0B1F33]"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAmenity(am)}
                          className="rounded accent-[#C9A45C] h-4 w-4"
                        />
                        <span>{am}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Rooms Grid */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Sorting & Result Counts Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#C9A45C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="tabular-nums">
                <span className="text-xs font-semibold text-[#0B1F33]">
                  Showing {rooms.length} {rooms.length === 1 ? 'Category' : 'Categories'}
                </span>
                <span className="text-xs text-[#6B6B6B] ml-2">
                  ({rooms.filter((r) => r.isAvailableForQuery).length} available for {checkIn} to {checkOut})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#6B6B6B]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold rounded-lg bg-[#F8F5EF] border border-[#C9A45C]/30 px-3 py-1.5 focus:bg-white focus:outline-hidden text-[#252525]"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="capacity">Occupancy: High to Low</option>
                  <option value="occupancy_asc">Occupancy: Low to High</option>
                  <option value="availability">Availability: Available First</option>
                  <option value="room_type">Room Type Category</option>
                </select>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-xl bg-[#9B4545]/10 border border-[#9B4545]/30 text-[#9B4545] text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rooms Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 rounded-2xl bg-[#EDE7DC] animate-pulse" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#C9A45C]/30 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EDE7DC] text-[#C9A45C] flex items-center justify-center mx-auto">
                  <Bed className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#0B1F33]">
                  No Accommodations Match Your Filters
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
                  No rooms matched your current combination of category, occupancy, or availability filters.
                  Try adjusting your criteria or resetting all filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B1F33] text-xs font-bold hover:bg-[#B58E47] transition-colors shadow-xs cursor-pointer"
                >
                  Reset All Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    requestedGuests={guests}
                    onViewDetails={handleViewDetails}
                    onBookNow={handleBookNow}
                  />
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Room Details Modal */}
      <RoomDetailsModal
        room={modalRoom}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onBookNow={handleBookNow}
      />

    </div>
  );
};
